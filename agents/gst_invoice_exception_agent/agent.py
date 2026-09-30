"""Read-only GST invoice-exception ADK agent.

The fixtures make the service safe to deploy and demonstrate the trajectory.
Replace them only with reviewed, authenticated ERP and GST read APIs.
"""
from pathlib import Path

from google.adk.agents import Agent
from google.adk.tools import ToolContext

THRESHOLD = 500.0
INSTRUCTION = Path(__file__).with_name("instruction.txt").read_text(encoding="utf-8")
INVOICES = {
    "INV-1001": {"id": "INV-1001", "invoice_number": "SUP-2026-104", "vendor_id": "V-001", "vendor_gstin": "27ABCDE1234F1Z5", "po_number": "PO-9001", "amount": 1200.0, "variance": 40.0, "quantity": 10},
    "INV-1002": {"id": "INV-1002", "invoice_number": "SUP-2026-105", "vendor_id": "V-001", "vendor_gstin": "27ABCDE1234F1Z5", "po_number": "PO-9002", "amount": 2200.0, "variance": 700.0, "quantity": 20},
    "INV-1003": {"id": "INV-1003", "invoice_number": "SUP-2026-106", "vendor_id": "V-002", "vendor_gstin": "29WRONG1234F1Z1", "po_number": "PO-9003", "amount": 800.0, "variance": 0.0, "quantity": 5},
}
PURCHASE_ORDERS = {"PO-9001": {"po_number": "PO-9001", "amount": 1240.0, "quantity": 10, "status": "open"}, "PO-9002": {"po_number": "PO-9002", "amount": 1500.0, "quantity": 20, "status": "open"}, "PO-9003": {"po_number": "PO-9003", "amount": 800.0, "quantity": 5, "status": "open"}}
GOODS_RECEIPTS = {"PO-9001": {"po_number": "PO-9001", "received_quantity": 10, "status": "received"}, "PO-9002": {"po_number": "PO-9002", "received_quantity": 20, "status": "received"}, "PO-9003": {"po_number": "PO-9003", "received_quantity": 5, "status": "received"}}
VENDORS = {"V-001": {"vendor_id": "V-001", "approved_gstin": "27ABCDE1234F1Z5", "status": "active"}, "V-002": {"vendor_id": "V-002", "approved_gstin": "29ABCDE1234F1Z1", "status": "active"}}

def _called(context: ToolContext) -> None:
    context.state["tool_calls"] = context.state.get("tool_calls", 0) + 1

def get_invoice(invoice_id: str, tool_context: ToolContext) -> dict:
    """Fetch one invoice by ID. Call this FIRST for every invoice task. Do not call for purchase orders or GST returns. Returns an invoice or an error payload."""
    invoice = INVOICES.get(invoice_id)
    if not invoice: return {"status": "error", "message": f"Invoice {invoice_id} was not found."}
    tool_context.state["invoice_id"], tool_context.state["variance"] = invoice_id, invoice["variance"]; _called(tool_context)
    return {"status": "ok", "invoice": invoice}

def get_purchase_order(po_number: str, tool_context: ToolContext) -> dict:
    """Fetch a purchase order when the invoice references one. Do not call without a PO number. Returns an order or an error payload."""
    _called(tool_context); return {"status": "ok", "purchase_order": PURCHASE_ORDERS[po_number]} if po_number in PURCHASE_ORDERS else {"status": "error", "message": f"Purchase order {po_number} was not found."}

def get_goods_receipt(po_number: str, tool_context: ToolContext) -> dict:
    """Fetch receipt status only when quantity or receipt validation is required. Do not call for price-only discrepancies. Returns a receipt or an error payload."""
    _called(tool_context); return {"status": "ok", "goods_receipt": GOODS_RECEIPTS[po_number]} if po_number in GOODS_RECEIPTS else {"status": "error", "message": f"No goods receipt exists for {po_number}."}

def get_gst_return_match(invoice_number: str, vendor_gstin: str, tool_context: ToolContext) -> dict:
    """Check an invoice GST-return match after invoice details are available. Do not call without both values. Returns a match or an error payload."""
    if not invoice_number or not vendor_gstin: return {"status": "error", "message": "Invoice number and vendor GSTIN are required."}
    _called(tool_context); return {"status": "ok", "matched": True, "invoice_number": invoice_number, "vendor_gstin": vendor_gstin}

def get_vendor_profile(vendor_id: str, tool_context: ToolContext) -> dict:
    """Fetch approved vendor identity and GSTIN when verification is required. Do not call without a vendor ID. Returns vendor data or an error payload."""
    _called(tool_context); return {"status": "ok", "vendor": VENDORS[vendor_id]} if vendor_id in VENDORS else {"status": "error", "message": f"Vendor {vendor_id} was not found."}

root_agent = Agent(name="gst_invoice_exception_agent", model="gemini-3.5-flash", description="Investigates GST invoice exceptions with read-only finance tools.", instruction=INSTRUCTION, tools=[get_invoice, get_purchase_order, get_goods_receipt, get_gst_return_match, get_vendor_profile])
