import zipfile
import xml.etree.ElementTree as ET
import os

def extract_docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for p in root.findall('.//w:p', namespaces):
                p_text = []
                for t in p.findall('.//w:t', namespaces):
                    if t.text:
                        p_text.append(t.text)
                if p_text:
                    paragraphs.append("".join(p_text))
            return "\n".join(paragraphs)
    except Exception as e:
        return f"[Error docx {path}: {str(e)}]"

def extract_odt_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('content.xml')
            root = ET.fromstring(xml_content)
            # ODF namespaces
            namespaces = {
                'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
                'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
            }
            paragraphs = []
            # Find all text:p elements
            for p in root.findall('.//text:p', namespaces):
                p_text = "".join(p.itertext())
                if p_text:
                    paragraphs.append(p_text)
            return "\n".join(paragraphs)
    except Exception as e:
        return f"[Error odt {path}: {str(e)}]"

if __name__ == "__main__":
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    
    docx_path = os.path.join(workspace, "BrokerFlow_Registro_Funzionalita_V1_Bozza.docx")
    odt_path = os.path.join(workspace, "correzioni 1.odt")
    
    docx_txt = extract_docx_text(docx_path)
    odt_txt = extract_odt_text(odt_path)
    
    with open(os.path.join(workspace, "scratch/docx_content.txt"), "w", encoding="utf-8") as f:
        f.write(docx_txt)
    print("Extracted DOCX to scratch/docx_content.txt")
        
    with open(os.path.join(workspace, "scratch/odt_content.txt"), "w", encoding="utf-8") as f:
        f.write(odt_txt)
    print("Extracted ODT to scratch/odt_content.txt")
