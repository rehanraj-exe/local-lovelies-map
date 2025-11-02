import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet as WalletIcon, Plus, History } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_id: string | null;
}

const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("relocal@upi");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"add" | "history">("add");

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch wallet balance
      let { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) throw walletError;

      // Create wallet if it doesn't exist
      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      }

      setBalance(wallet.balance);

      // Fetch transactions
      const { data: txns, error: txnsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txnsError) throw txnsError;
      setTransactions(txns || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amountValue < 10) {
      toast({
        title: "Minimum Amount",
        description: "Minimum amount to add is ₹10",
        variant: "destructive",
      });
      return;
    }

    setAddingMoney(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Create transaction record
      const { data: transaction, error: txnError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          shop_id: "00000000-0000-0000-0000-000000000000", // Platform transaction
          amount: amountValue,
          payment_method: "upi",
          status: "pending",
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Generate UPI deep link
      const upiUrl = `upi://pay?pa=${upiId}&pn=ReLocal&am=${amountValue}&cu=INR&tn=Add money to Re:Wallet - ${transaction.id}`;

      toast({
        title: "Opening UPI App",
        description: "Complete the payment in your UPI app",
      });

      // Open UPI app
      window.location.href = upiUrl;

      // Note: In production, you'd implement webhook to verify payment
      setTimeout(() => {
        toast({
          title: "Payment Initiated",
          description: "Please complete the payment in your UPI app. Your wallet will be updated once payment is confirmed.",
        });
        setAmount("");
        setAddingMoney(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setAddingMoney(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <WalletIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Re:Wallet</h1>
          </div>
          
          <div className="mt-6">
            <p className="text-sm opacity-90 mb-2">Available Balance</p>
            <p className="text-4xl font-bold">₹{balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab("add")}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "add"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Money
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        {activeTab === "add" ? (
          <Card>
            <CardHeader>
              <CardTitle>Add Money to Wallet</CardTitle>
              <CardDescription>
                Add money using UPI to use for your purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Enter Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                />
                <p className="text-sm text-muted-foreground">Minimum: ₹10</p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label className="mb-3 block">Quick Add</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      onClick={() => setAmount(amt.toString())}
                      className="h-12"
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value="upi" className="space-y-3">
                  <div className="flex items-center space-x-2 border rounded-lg p-4 bg-accent/50">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer font-normal">
                      UPI Payment
                      <p className="text-sm text-muted-foreground">Pay via any UPI app</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Add Money Button */}
              <Button
                onClick={handleAddMoney}
                disabled={addingMoney || !amount}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {addingMoney ? "Processing..." : `Add ₹${amount || "0"} to Wallet`}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {txn.order_id ? "Payment" : "Money Added"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(txn.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
                          Status: {txn.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            txn.order_id ? "text-destructive" : "text-green-600"
                          }`}
                        >
                          {txn.order_id ? "-" : "+"}₹{txn.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {txn.payment_method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Wallet;
