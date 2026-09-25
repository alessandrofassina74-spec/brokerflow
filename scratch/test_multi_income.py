import http.server
import socketserver
import threading
import time
import subprocess
import json
import urllib.request
import websocket

PORT = 8998
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
    "--remote-debugging-port=9270",
    "--remote-allow-origins=*",
    f"http://127.0.0.1:{PORT}/index.html"
]

proc = subprocess.Popen(chrome_cmd)
time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:9270/json")
    targets = json.loads(req.read().decode())
    page_target = [t for t in targets if t.get("type") == "page"][0]
    ws_url = page_target["webSocketDebuggerUrl"]
    
    ws = websocket.create_connection(ws_url)
    ws.send(json.dumps({"id": 1, "method": "Console.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 3, "method": "Log.enable"}))
    
    print("--- Running Multi-Income Integration Test ---")
    time.sleep(5) # wait for all DBs to load fully
    
    # Stub alert to avoid blocking execution
    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {"expression": "window.alert = function() {};", "returnByValue": True}
    }))
    
    # Run test evaluation script
    test_script = """
    (function() {
        try {
            // 1. Initialise a new deal
            window.initNuovaPratica();
            
            // Set first income CUD details
            const macroSelect = document.getElementById("wiz-q10-macro-categoria");
            if (!macroSelect) return { error: "wiz-q10-macro-categoria not found" };
            macroSelect.value = "dipendente";
            window.toggleQ10MacroCategory("dipendente");
            
            document.getElementById("wiz-q10-cu1").value = 30000;
            document.getElementById("wiz-q10-cu21").value = 5000;
            document.getElementById("wiz-q10-cu6").value = 365;
            
            // 2. Set has-second-income to true
            const hasSecCheckbox = document.getElementById("wiz-q10-has-second-income");
            if (!hasSecCheckbox) return { error: "wiz-q10-has-second-income not found" };
            hasSecCheckbox.checked = true;
            window.toggleSecondIncome(true);
            
            // Set second income to locazione with € 1000/month
            const macroSelect2 = document.getElementById("wiz-q10-macro-categoria-2");
            if (!macroSelect2) return { error: "wiz-q10-macro-categoria-2 not found" };
            macroSelect2.value = "locazione";
            window.toggleQ10MacroCategory2("locazione");
            document.getElementById("wiz-q10-locazione-netto-2").value = 1000;
            
            // Recalculate
            window.updateCalculatedIncome();
            
            const firstNetVal = parseFloat(document.getElementById("wiz-q10-netto-mensile").value);
            const secondNetVal = parseFloat(document.getElementById("wiz-q10-netto-mensile-2").value);
            
            // Save first borrower subject
            window.saveCurrentSubject(true);
            
            // Check saved subjects
            const subjCount = wizardSubjects.length;
            const primarySubject = wizardSubjects[0];
            const incomes = primarySubject.incomes || [];
            
            // Save Deal to localstorage
            window.savePratica();
            
            // Reset wizard
            window.resetSubjectForm();
            
            // Reload subject to edit
            window.editSubject(0);
            
            const restoredHasSec = document.getElementById("wiz-q10-has-second-income").checked;
            const restoredSecMacro = document.getElementById("wiz-q10-macro-categoria-2").value;
            const restoredSecNet = parseFloat(document.getElementById("wiz-q10-netto-mensile-2").value);
            const restoredSecLocNet = parseFloat(document.getElementById("wiz-q10-locazione-netto-2").value);
            
            return {
                firstNetCalculated: firstNetVal,
                secondNetCalculated: secondNetVal,
                subjectsCount: subjCount,
                incomesSavedLength: incomes.length,
                incomesSaved: incomes,
                restoredHasSecondIncome: restoredHasSec,
                restoredSecondMacro: restoredSecMacro,
                restoredSecondNetValue: restoredSecNet,
                restoredSecondLocValue: restoredSecLocNet
            };
        } catch(e) {
            return { error: e.message, stack: e.stack };
        }
    })()
    """
    
    ws.send(json.dumps({
        "id": 20,
        "method": "Runtime.evaluate",
        "params": {"expression": test_script, "returnByValue": True}
    }))
    
    # Receive results and print console messages
    timeout = time.time() + 10
    result_data = None
    while time.time() < timeout:
        try:
            ws.settimeout(0.5)
            res = json.loads(ws.recv())
            if res.get("method") == "Console.messageAdded":
                msg = res["params"]["message"]
                print(f"CONSOLE MESSAGE [{msg.get('level')}]: {msg.get('text')}")
            elif res.get("method") == "Runtime.exceptionThrown":
                details = res["params"]["exceptionDetails"]
                print(f"EXCEPTION: {details.get('text')} - {details.get('exception', {}).get('description')}")
            elif res.get("id") == 20:
                result_data = res.get("result", {}).get("result", {}).get("value")
                break
        except websocket.WebSocketTimeoutException:
            pass
            
    print("Test Result JSON:")
    print(json.dumps(result_data, indent=2))
    
    # Verify values
    assert result_data is not None, "No result received from Chrome"
    assert "error" not in result_data, f"Error in JS execution: {result_data.get('error')}"
    assert result_data["subjectsCount"] == 1, f"Expected 1 subject, got {result_data.get('subjectsCount')}"
    assert result_data["incomesSavedLength"] == 2, f"Expected 2 incomes saved, got {result_data.get('incomesSavedLength')}"
    assert result_data["incomesSaved"][0]["tipoContratto"] == "dipendente_ti", "First contract type incorrect"
    assert result_data["incomesSaved"][1]["tipoContratto"] == "locazione", "Second contract type incorrect"
    assert result_data["incomesSaved"][1]["netto"] == 1000, "Second net income incorrect"
    assert result_data["restoredHasSecondIncome"] is True, "Checkbox state not restored"
    assert result_data["restoredSecondMacro"] == "locazione", "Restored second macro category incorrect"
    assert result_data["restoredSecondNetValue"] == 1000, "Restored second net monthly incorrect"
    assert result_data["restoredSecondLocValue"] == 1000, "Restored second locazione input incorrect"
    
    print("\n✅ INTEGRATION TEST PASSED SUCCESSFULLY!")
            
finally:
    proc.terminate()
    server.shutdown()
