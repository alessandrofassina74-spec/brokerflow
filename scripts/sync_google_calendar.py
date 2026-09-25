import urllib.request
import re
from datetime import datetime, timezone, timedelta
import json
import os

try:
    import zoneinfo
    LOCAL_TZ = zoneinfo.ZoneInfo("Europe/Rome")
except Exception:
    LOCAL_TZ = None

DEFAULT_GCAL_URL = "https://calendar.google.com/calendar/ical/alessandro.fassina%40credipass.it/private-f6aaf5491172e94c8aa7283c89974f36/basic.ics"
CACHE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "google_calendar_cache.json")
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "calendar_config.json")

def get_configured_url():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                return cfg.get("ical_url", DEFAULT_GCAL_URL)
        except Exception:
            pass
    return DEFAULT_GCAL_URL

def set_configured_url(url):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump({"ical_url": url, "updated_at": datetime.now().isoformat()}, f, indent=2)

def parse_ical_feed(ical_text):
    unfolded = re.sub(r'\r?\n[ \t]', '', ical_text)
    events = []
    
    # Filter window: last 1 year (365 days) up to 3 years into the future
    now = datetime.now()
    min_date = (now - timedelta(days=365)).date()
    max_date = (now + timedelta(days=365 * 3)).date()
    
    vevent_blocks = unfolded.split('BEGIN:VEVENT')[1:]
    for block in vevent_blocks:
        ev_data = {}
        for line in block.splitlines():
            line = line.strip()
            if not line or line.startswith('END:VEVENT'):
                continue
            if ':' in line:
                key_part, val_part = line.split(':', 1)
                key = key_part.split(';')[0].upper()
                val_clean = val_part.replace('\\,', ',').replace('\\;', ';').replace('\\n', '\n').replace('\\N', '\n')
                
                if key not in ev_data:
                    ev_data[key] = val_clean
        
        summary = ev_data.get('SUMMARY', '').strip()
        dtstart_raw = ev_data.get('DTSTART', '').strip()
        dtend_raw = ev_data.get('DTEND', '').strip()
        desc = ev_data.get('DESCRIPTION', '').strip()
        loc = ev_data.get('LOCATION', '').strip()
        uid = ev_data.get('UID', '').strip()
        status = ev_data.get('STATUS', '').strip()
        
        if status.upper() == 'CANCELLED':
            continue
            
        date_str = ''
        time_str = ''
        duration_mins = 60
        
        if dtstart_raw:
            if len(dtstart_raw) == 8 and dtstart_raw.isdigit():
                try:
                    dt = datetime.strptime(dtstart_raw, '%Y%m%d')
                    if min_date <= dt.date() <= max_date:
                        date_str = dt.strftime('%Y-%m-%d')
                        time_str = '09:00'
                except:
                    pass
            elif 'T' in dtstart_raw:
                try:
                    clean_ts = dtstart_raw.replace('Z', '')
                    if len(clean_ts) >= 15:
                        dt = datetime.strptime(clean_ts[:15], '%Y%m%dT%H%M%S')
                        if dtstart_raw.endswith('Z'):
                            dt = dt.replace(tzinfo=timezone.utc)
                            if LOCAL_TZ:
                                dt = dt.astimezone(LOCAL_TZ)
                        if min_date <= dt.date() <= max_date:
                            date_str = dt.strftime('%Y-%m-%d')
                            time_str = dt.strftime('%H:%M')
                except Exception:
                    pass
                    
        if not date_str:
            continue
            
        summary_upper = summary.upper()
        desc_upper = desc.upper()
        
        ev_type = 'incontro'
        if 'RECALL' in summary_upper or 'RECALL' in desc_upper:
            ev_type = 'recall'
        elif 'ROGITO' in summary_upper or 'STIPULA' in summary_upper:
            ev_type = 'rogito'
        elif 'DELIBERA' in summary_upper or 'SCADENZA' in summary_upper:
            ev_type = 'delibera'
        elif 'PERIZIA' in summary_upper or 'PERITO' in summary_upper:
            ev_type = 'perizia'
        elif 'APPUNTAMENTO' in summary_upper or 'INCONTRO' in summary_upper or 'CONSULENZA' in summary_upper:
            ev_type = 'incontro'
        else:
            ev_type = 'altro'
            
        title = summary if summary else 'Evento Google Calendar'
        
        # Clean HTML tags in description
        clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
        clean_desc = re.sub(r'\s+', ' ', clean_desc)
        
        # Extract client name if possible
        client_name = ""
        m_lead = re.search(r'-\s*([A-Z\s]{3,})$', summary)
        if m_lead:
            client_name = m_lead.group(1).strip()
        else:
            m_desc = re.search(r'per lead creato il.*?([A-Z][a-z]+ [A-Z][a-z]+)', desc)
            if m_desc:
                client_name = m_desc.group(1).strip()
            
        events.append({
            'id': f'gcal_{uid}' if uid else f'gcal_{len(events)}',
            'title': title,
            'type': ev_type,
            'date': date_str,
            'time': time_str,
            'duration': str(duration_mins),
            'client': client_name,
            'location': loc,
            'notes': clean_desc[:250] + ('...' if len(clean_desc) > 250 else '') if clean_desc else '',
            'source': 'google_calendar',
            'googleUid': uid,
            'completed': False
        })
        
    # Sort events by date and time
    events.sort(key=lambda x: (x['date'], x['time']))
    return events

def fetch_and_cache_google_calendar(url=None):
    feed_url = url or get_configured_url()
    if url:
        set_configured_url(url)
        
    req = urllib.request.Request(feed_url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw_content = resp.read().decode('utf-8', errors='ignore')
        
    events = parse_ical_feed(raw_content)
    
    # Save cache
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    cache_payload = {
        "updated_at": datetime.now().isoformat(),
        "feed_url": feed_url,
        "count": len(events),
        "events": events
    }
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache_payload, f, ensure_ascii=False, indent=2)
        
    return cache_payload

def get_cached_google_calendar():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None
