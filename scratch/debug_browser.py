import http.server
import socketserver
import threading
import time
import subprocess
import json
import urllib.request
import websocket

PORT = 9017
DIRECTORY = "/Users/alessandrofassina/Desktop/broker flow"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

server = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
server_thread = threading.Thread(target=server.serve_forever)
server_thread.daemon = True
server_thread.start()

chrome_cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9269",
    "--remote-allow-origins=*",
    f"http://127.0.0.1:{PORT}/index.html"
]

proc = subprocess.Popen(chrome_cmd)
time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:9269/json")
    targets = json.loads(req.read().decode())
    page_target = [t for t in targets if t.get("type") == "page"][0]
    ws_url = page_target["webSocketDebuggerUrl"]
    
    ws = websocket.create_connection(ws_url)
    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    
    time.sleep(4)
    
    verify_policy_script = """
    (function() {
        // Set macro category to colf_badanti
        document.getElementById("wiz-q10-macro-categoria").value = "colf_badanti";
        window.toggleQ10MacroCategory("colf_badanti");
        
        // Fill CUD details to give some positive income
        document.getElementById("wiz-q10-cu1").value = 24000;
        document.getElementById("wiz-q10-cu6").value = 365;
        document.getElementById("wiz-q10-cu21").value = 3000;
        
        // Let's set some default loan params
        document.getElementById("p3-valore-field").value = 200000;
        document.getElementById("p3-importo-field").value = 100000;
        
        window.updateCalculations();
        
        // Get the results list from the engine
        const results = window.lastCalculatedResults; 
        if (!results || !results.allEvaluated) {
            return "No results found";
        }
        
        return results.allEvaluated.map(r => {
            const check = r.checks.find(c => c.name === "Tipologia Occupazione");
            return {
                bank: r.name,
                occupazioneStatus: check ? check.status : "not_found",
                occupazioneText: check ? check.text : ""
            };
        });
    })()
    """
    
    ws.send(json.dumps({
        "id": 300,
        "method": "Runtime.evaluate",
        "params": {"expression": verify_policy_script, "returnByValue": True}
    }))
    
    # Wait for result
    timeout = time.time() + 5
    while time.time() < timeout:
        try:
            ws.settimeout(0.5)
            res = json.loads(ws.recv())
            if "id" in res and res["id"] == 300:
                print("POLICY VERIFICATION RESULTS:")
                print(json.dumps(res["result"].get("result", {}).get("value"), indent=4))
                break
        except websocket.WebSocketTimeoutException:
            pass
            
finally:
    proc.terminate()
    server.shutdown()
