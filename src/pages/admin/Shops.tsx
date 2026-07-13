import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Shops = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const deleteShop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;
    try {
      const { error } = await supabase.from('shops').delete().eq('id', id);
      if (error) throw error;
      toast.success('Shop deleted successfully');
      setShops(shops.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast.error('Failed to delete shop');
    }
  };

  const filteredShops = shops.filter((shop) => 
    shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Manage Shops</h1>
        <Link to="/admin/shops/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Shop
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name, category, or city..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No shops found</TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.category}</TableCell>
                  <TableCell>{shop.city || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={shop.open_now ? "success" : "secondary"}>
                      {shop.open_now ? "Open" : "Closed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link to={`/admin/shops/${shop.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => deleteShop(shop.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Shops;
