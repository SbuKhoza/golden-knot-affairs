import { useEffect, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { guestQrPayload } from "@/utils/guestQr";

export function GuestQrPass({ guest }) {
  const [visible, setVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const fullName = [guest.firstName, guest.surname].filter(Boolean).join(" ");

  useEffect(() => {
    if (!visible || !guest.id) return undefined;

    let active = true;
    setError("");
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(guestQrPayload(guest.id), { errorCorrectionLevel: "M", margin: 3, width: 420 }))
      .then((url) => {
        if (active) setImageUrl(url);
      })
      .catch(() => {
        if (active) setError("We couldn't prepare your entry QR. Please try again.");
      });

    return () => {
      active = false;
    };
  }, [guest.id, visible]);

  return (
    <section className="animate-soft mt-8 rounded-md border border-border/60 bg-card/90 p-6 text-center backdrop-blur-md sm:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/50 text-primary">
        <QrCode aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-2xl">Your entry QR</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A personal QR for {fullName || "your invitation"}.
      </p>
      <Button
        className="mt-5"
        variant={visible ? "secondary" : "outline"}
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-expanded={visible}
      >
        <QrCode aria-hidden="true" />
        {visible ? "Hide QR code" : "Show my QR code"}
      </Button>
      {visible ? (
        <div className="mx-auto mt-6 max-w-sm border-t border-border pt-6" aria-live="polite">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={`Unique entry QR code for ${fullName}`} className="mx-auto size-64 max-w-full bg-white p-2" />
              <p className="mt-3 text-sm font-medium">{fullName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Show this QR at the reception entrance. It can only be read by the venue’s scanner.</p>
              <Button className="mt-4" variant="outline" asChild>
                <a href={imageUrl} download={`entry-qr-${guest.id}.png`}>
                  <Download aria-hidden="true" />
                  Save QR image
                </a>
              </Button>
            </>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Preparing your QR…</p>
          )}
        </div>
      ) : null}
    </section>
  );
}