import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import SubscriptionCheckout from "./CheckoutForm";

export default function SubscriptionModal({isOpen, onClose,priceId, selectedType}: {isOpen: boolean, onClose: () => void,priceId: string, selectedType: string}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Checkout</DialogTitle>
        <DialogDescription>
          Complete your purchase securely with Stripe.
        </DialogDescription>
      </DialogHeader>
      
      {isOpen && (
       <SubscriptionCheckout priceId={priceId} onClose={onClose} selectedType={selectedType} />
      )}

    </DialogContent>
  </Dialog>
  );
}
