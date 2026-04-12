import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
    <div className="text-[13px] text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
)

const PrivacyPolicy = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold text-foreground">Privacy Policy</h1>
      </header>

      <div className="px-5 pt-6 space-y-6">
        <p className="text-[12px] text-muted-foreground">Last updated: April 2026</p>

        <Section title="Who we are">
          <p>
            Tangible is operated by Vikramaditya Lakhotia ("we", "us", "our"), based in London, United Kingdom.
            We are the data controller for the personal data you provide when using this app.
          </p>
          <p>If you have any questions, contact us at: <span className="text-foreground font-medium">vikramlakhotia@hotmail.com</span></p>
        </Section>

        <Section title="What data we collect">
          <p>When you use Tangible, we collect:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-foreground font-medium">Account information</span> — your name and email address, provided via Apple or Google sign-in</li>
            <li><span className="text-foreground font-medium">Photos</span> — images you choose to import from your photo library. We only access photos you explicitly select</li>
            <li><span className="text-foreground font-medium">Photo metadata</span> — date taken and GPS coordinates embedded in your photos (EXIF data), used to organise your book by time and location</li>
            <li><span className="text-foreground font-medium">Delivery address</span> — name and address you provide when placing an order</li>
            <li><span className="text-foreground font-medium">Order history</span> — details of books you have ordered</li>
          </ul>
        </Section>

        <Section title="How we use your data">
          <p>We use your data solely to provide the Tangible service:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>To create, store, and display your photo books</li>
            <li>To organise photos by date and location into book layouts</li>
            <li>To process and fulfil your print orders</li>
            <li>To send you order status updates</li>
          </ul>
          <p>We do not sell your data. We do not use your photos for advertising or AI training.</p>
        </Section>

        <Section title="Where your data is stored">
          <p>
            Your account data, book projects, and uploaded photos are stored securely using Supabase,
            a cloud database and storage provider. Data is stored on servers within the European Union.
          </p>
          <p>
            When you place a print order, your delivery address and order details are shared with our
            print partner (Prodigi) solely for the purpose of fulfilling your order.
          </p>
        </Section>

        <Section title="How long we keep your data">
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-foreground font-medium">Draft books</span> — kept for 30 days, then automatically deleted</li>
            <li><span className="text-foreground font-medium">Ordered books</span> — kept for 1 year to support reorders</li>
            <li><span className="text-foreground font-medium">Account data</span> — kept until you delete your account</li>
          </ul>
        </Section>

        <Section title="Your rights (UK GDPR)">
          <p>You have the right to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data ("right to be forgotten")</li>
            <li>Object to how we process your data</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <span className="text-foreground font-medium">vikramlakhotia@hotmail.com</span>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="Photos and your privacy">
          <p>
            Your photos are uploaded to secure cloud storage and are only visible to you.
            We do not share, sell, or use your photos for any purpose other than displaying
            them in your personal photo book.
          </p>
          <p>
            Photo access is granted by you through iOS's native permission system. You can
            revoke access at any time in iPhone Settings → Tangible → Photos.
          </p>
        </Section>

        <Section title="Cookies and tracking">
          <p>
            We do not use tracking cookies or third-party analytics. We use a session token
            stored locally on your device to keep you signed in.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make significant changes to this policy, we will notify you in the app.
            The "last updated" date at the top of this page will always reflect the most recent version.
          </p>
        </Section>

        <div className="pt-4 pb-8 border-t border-border">
          <p className="text-[12px] text-muted-foreground">
            Tangible is operated by Vikramaditya Lakhotia, London, UK.{'\n'}
            Contact: vikramlakhotia@hotmail.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
