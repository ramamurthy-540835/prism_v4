import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>
    {children}
    <footer className="bg-white border-t border-[#dcdcdc] text-[#525252] text-xs text-center p-3">
      <a href="mailto:ai@nelture.ai">ai@nelture.ai</a> · <a href="https://wa.me/918925310144">WhatsApp +91 89253 10144</a> · <a href="https://nelture.ai">nelture.ai</a>
    </footer>
  </body></html>;
}
