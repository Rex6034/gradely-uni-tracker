import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, DollarSign, ShoppingCart, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  transaction_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  transaction_date: string;
  sale_items: Array<{
    medicine_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface SalesStats {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topSellingMedicine: string;
}

const SalesReports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    topSellingMedicine: '',
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactionsByDate();
  }, [transactions, dateRange, customStartDate, customEndDate]);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!pharmacy) return;

      const { data } = await supabase
        .from('sales_transactions')
        .select(`
          *,
          sale_items (
            medicine_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('pharmacy_id', pharmacy.id)
        .order('transaction_date', { ascending: false });

      if (data) {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByDate = () => {
    let filtered = transactions;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        filtered = transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= today;
        });
        break;
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= monthAgo;
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          filtered = transactions.filter(t => {
            const transactionDate = new Date(t.transaction_date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
        break;
      default:
        break;
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (transactions: Transaction[]) => {
    const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalTransactions = transactions.length;
    const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Calculate top selling medicine
    const medicineQuantities: { [key: string]: number } = {};
    transactions.forEach(t => {
      t.sale_items.forEach(item => {
        medicineQuantities[item.medicine_name] = (medicineQuantities[item.medicine_name] || 0) + item.quantity;
      });
    });

    const topSellingMedicine = Object.entries(medicineQuantities)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    setSalesStats({
      totalSales,
      totalTransactions,
      averageTransactionValue,
      topSellingMedicine,
    });
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'upi': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Transaction Number', 'Date', 'Customer', 'Amount', 'Payment Method', 'Items'];
    const csvData = filteredTransactions.map(t => [
      t.transaction_number,
      new Date(t.transaction_date).toLocaleDateString(),
      t.customer_name || 'Walk-in Customer',
      t.total_amount.toFixed(2),
      t.payment_method,
      t.sale_items.map(item => `${item.medicine_name} (${item.quantity})`).join('; ')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Sales report has been downloaded as CSV",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Reports</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-40"
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{salesStats.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {salesStats.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{salesStats.averageTransactionValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Top Medicine</p>
                <p className="text-lg font-bold text-orange-600 truncate">
                  {salesStats.topSellingMedicine}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found for the selected date range
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Transaction #</th>
                    <th className="text-left p-2">Date & Time</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Items</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium text-blue-600">
                          {transaction.transaction_number}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>{transaction.customer_name || 'Walk-in Customer'}</div>
                        {transaction.customer_phone && (
                          <div className="text-xs text-gray-500">
                            {transaction.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="space-y-1">
                          {transaction.sale_items.map((item, index) => (
                            <div key={index} className="text-xs">
                              {item.medicine_name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-bold text-green-600">
                          ₹{transaction.total_amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getPaymentMethodColor(transaction.payment_method)}>
                          {transaction.payment_method.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReports;