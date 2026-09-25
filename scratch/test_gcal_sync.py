import urllib.request
import re
from datetime import datetime, timezone
import zoneinfo
import json

def parse_ical_feed(ical_text):
    unfolded = re.sub(r'\r?\n[ \t]', '', ical_text)
    events = []
    
    try:
        local_tz = zoneinfo.ZoneInfo('Europe/Rome')
    except Exception:
        local_tz = None
        
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
                    if 2020 <= dt.year <= 2035:
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
                            if local_tz:
                                dt = dt.astimezone(local_tz)
                        if 2020 <= dt.year <= 2035:
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
        
        # Clean HTML tags in description if any
        clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
        clean_desc = re.sub(r'\s+', ' ', clean_desc)
        
        # Extract client name if possible
        client_name = ""
        # Match pattern like: "Recall - Lead Id 12345 - ROSSI MARIO" or "Lead Id ... - ROSSI MARIO"
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
        
    return events

if __name__ == '__main__':
    url = 'https://calendar.google.com/calendar/ical/alessandro.fassina%40credipass.it/private-f6aaf5491172e94c8aa7283c89974f36/basic.ics'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode('utf-8', errors='ignore')

    evs = parse_ical_feed(raw)
    print(f'Parsed {len(evs)} events')
    evs.sort(key=lambda x: x['date'] + ' ' + x['time'], reverse=True)
    for ev in evs[:10]:
        print(f"[{ev['date']} {ev['time']}] ({ev['type']}) {ev['title']} | Cliente: {ev['client']}")
