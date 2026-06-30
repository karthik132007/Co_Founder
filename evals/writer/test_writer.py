
from agents.writer.writer import write
import time
import datetime
from pathlib import Path


def test_writer(prompt:str):
    try:
        toc = time.time()
        result = write(prompt)
        tic = time.time()

        return {
            "result": result,
            "time": tic - toc
        }
    except Exception as e:
        return {"error": f"Failed!, cause: {e}"}

research = """ [{"url": "https://bytebytego.com/guides/unified-payments-interface-upi-in-india", "title": "ByteByteGo | Unified Payments Interface (UPI)", "content": "# Unified Payments Interface (UPI). Explore the architecture and workings of India's UPI payment system. The Unified Payments Interface (UPI) for real-time transactions in India is a good case study for other nations in the payment space. UPI is an instant real-time payment system developed by the National Payments Corporation of India. UPI = payment markup language + standard for interoperable payments. Let’s take a look at how it works. Bob’s payment app creates VPA with the acquiring bank. The acquiring bank returns with VPA. The payment app returns VPA to Bob. ## Link to Bank Account. Bob wants to link his SBI bank account with VPA bob at the axis. The request is forwarded to NPCI (National Payments Corporation of India). It resolves the account detail from VPA with different issuing banks. Alice enters Bob’s UPI ID bob and the amount INR 100. NPCI sends an instruction to SBI bank and add INR 100 to Bob’s account in SBI bank.", "score": 0.8785752, "raw_content": null}, {"url": "https://www.researchgate.net/figure/UPI-high-level-architecture_fig2_320661583", "title": "UPI high level architecture. - ResearchGate", "content": "Unified Payment Interface is a mobile centric, real time interbank payment system which has the potential to transform and universalize digital payments in", "score": 0.79883134, "raw_content": null}, {"url": "https://dev.to/zeeshanali0704/system-design-upi-unified-payment-interface-2ng3", "title": "System Design: UPI (Unified Payment Interface) - DEV Community", "content": "Cover image for System Design: UPI (Unified Payment Interface). # System Design: UPI (Unified Payment Interface). ### Unified Payments Interface (UPI) System Design. Designing a Unified Payments Interface (UPI) system involves creating a robust and secure architecture that enables real-time inter-bank transactions. NPCI provides the ecosystem for routing, processing and settlement services to members participating in UPI. PSP (Payment service Provider) is one of the entities in UPI ecosystem whose responsibility is to provide users with a frontend application which can be used for generating the VPAs and carrying out transactions. ### Functional Requirements for UPI System Design. ### Non Functional Requirements for UPI System Design. ### Capacity Estimation for UPI System Design. | Peak Daily Transactions | 601.9 Million (463 Million × 1.3) |. | Total API Calls per Day | 1.389 Billion (463 Million transactions × 3) |. | Peak API Calls per Day | 1.8057 Billion (601.9 Million transactions × 3) |.", "score": 0.79883134, "raw_content": null}, {"url": "https://stripe.com/resources/more/unified-payments-interface-upi", "title": "What is Unified Payments Interface (UPI)? - Stripe", "content": "*   Payment links No-code payments. # Unified Payments Interface (UPI): How it works and why businesses use it. Accept payments online, in person, and around the world with a payments solution built for any business—from scaling startups to global enterprises. In less than a decade, UPI’s popularity made India the global leader in real-time payments. Unified Payments Interface is India’s real-time payment system. With a UPI app such as PhonePe, Google Pay, Paytm, or Amazon Pay, you can send money from your bank account to another account as long as the owner of the second account has a UPI ID (also called a virtual payment address or VPA). This ID links to your bank account and is used to send and receive money via UPI. *   **Push payments:** The user enters a UPI ID or scans a QR code and initiates the payment. The business sends a payment request to the customer’s UPI ID.", "score": 0.78749067, "raw_content": null}, {"url": "https://www.youtube.com/watch?v=iI2NaN_QVTI", "title": "How UPI Works: Real-Time Payments in India | Paypal | Zelle", "content": "How UPI Works: Real-Time Payments in India | Paypal | Zelle\nByteMonk\n385000 subscribers\n19112 likes\n725681 views\n29 Oct 2024\nIn this video, we explore how UPI (Unified Payments Interface) has transformed real-time payments in India, making bank-to-bank transfers faster and more accessible than ever. We break down how UPI works, comparing it with global payment systems like PayPal, Alipay, Venmo, and Zelle. Learn how UPI differs from digital wallets, why it's free for users, and how it fits into the global payments ecosystem. If you're interested in the future of digital payments and real-time transfers, this video offers a complete breakdown.\n\n0:00 – Introduction: UPI and Real-Time Payments in India\n0:44 – How UPI Simplifies Bank Transfers\n1:26 – UPI vs Payment Gateways and Payment Processors\n3:00 – Step-by-Step Breakdown of a UPI Transaction\n4:52 – Virtual Payment Address (VPA) and QR Code Payments with UPI\n5:23 – API-Based Architecture of UPI: How It Works Behind the Scenes\n6:03 – Global Comparison: UPI vs PayPal, Alipay, Venmo, and Zelle\n9:15 – Conclusion: UPI’s Role in the Future of Global Payments\n\nhttps://www.linkedin.com/in/bytemonk/\n\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBt423WbyAD1YZO0Ljo1pzvY\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBssWTtcUlbngD_O5HaxXu6k\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBu38EjXRXzyPat3sYMHbIWU\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBuo5zjv9bPNLIks4tfd0Pui\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBsPWE24vdpmgeRFMRQyjvvj\nhttps://www.youtube.com/playlist?list=PLJq-63ZRPdBslxJd-ZT12BNBDqGZgFo58\n\nAWS Certification: \nAWS Certified Cloud Practioner: https://youtu.be/wF1pldkQrOY\nAWS Certified Solution Architect Associate: https://youtu.be/GzomXNLFgkk\nAWS Certified Solution Architect Professional: https://youtu.be/KFZrBxSA9tI\n\n#upi  #softwarearchitecture  #paypal\n433 comments\n", "score": 0.7352811, "raw_content": null}]
"""
prompt = f"""this is the output given by researcher on the research 'how UPI works'
this research containes lots of things that are not nesseary to show to user so remove them like sources and etc
 this need to be presented to end user so u need to rewrite it as presentaion 
 return clear markdown of content 
 here is research :
 {research}
"""

result = test_writer(prompt=prompt)
print(result)
try:
    report_path = Path(__file__).resolve().parent / "Writer_Test_Report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as fl:
        content = f"""
        Date: {datetime.datetime.now()}
        prompt: {prompt}
        time taken: {result.get("time", "N/A")} seconds
        result: {result.get("result", result.get("error", "No output"))}
    """
        fl.write(content)
except Exception as e:
    print(f"Failed to write report, cause: {e}")