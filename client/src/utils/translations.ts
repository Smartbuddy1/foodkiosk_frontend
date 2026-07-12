export const translations: Record<string, Record<string, string>> = {
  Hindi: {
    "Tap to Start": "शुरू करने के लिए टैप करें",
    "Select Language": "भाषा चुनें",
    "Choose Order Type": "ऑर्डर प्रकार चुनें",
    "Back": "पीछे",
    "Dine In": "यहीं खाएं",
    "Takeaway": "पैक करें",
    "Menu": "मेनू",
    "Search": "खोजें",
    "All": "सभी",
    "Add": "जोड़ें",
    "Out": "खत्म",
    "items": "आइटम",
    "Cart": "कार्ट",
    "Order Review": "ऑर्डर की समीक्षा",
    "Review": "समीक्षा",
    "Remove": "हटाएं",
    "Coupon": "कूपन",
    "Continue to Payment": "भुगतान के लिए आगे बढ़ें",
    "Payment": "भुगतान",
    "Card": "कार्ड",
    "UPI": "यूपीआई",
    "Cash": "नकद",
    "Summary": "सारांश",
    "Pay": "भुगतान करें",
    "Processing": "प्रोसेस हो रहा है...",
    "Order Token": "ऑर्डर टोकन",
    "Total": "कुल",
    "Estimated wait time: 8-12 minutes": "अनुमानित प्रतीक्षा समय: 8-12 मिनट"
  }
};

export function getTranslation(language: string, text: string): string {
  if (language === "English") return text;
  return translations[language]?.[text] ?? text;
}
