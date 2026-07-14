import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Package, Users, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingShops: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [
        { count: totalShops },
        { count: activeShops },
        { count: totalProducts },
        { count: outOfStockProducts },
        { count: totalUsers },
        { count: totalOrders },
        { count: pendingShops },
      ] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('open_now', true),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', false),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('verified', false),
      ]);

      setStats({
        totalShops: totalShops || 0,
        activeShops: activeShops || 0,
        totalProducts: totalProducts || 0,
        outOfStockProducts: outOfStockProducts || 0,
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        pendingShops: pendingShops || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: 'Total Shops',
      value: stats.totalShops,
      icon: Store,
      color: 'text-blue-500',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingShops,
      icon: AlertCircle,
      color: 'text-amber-500',
    },
    {
      title: 'Active Shops',
      value: stats.activeShops,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-purple-500',
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockProducts,
      icon: AlertCircle,
      color: 'text-red-500',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-orange-500',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your platform's live statistics and activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
