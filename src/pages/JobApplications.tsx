import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, Clock, Briefcase, User } from 'lucide-react';

const JobApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;

    setLoading(true);
    
    // First fetch the shop owned by the user
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (shopError) {
      toast.error('No shop found');
      navigate('/dashboard');
      return;
    }

    setShop(shopData);

    // Fetch all applications for jobs at this shop
    const { data: applicationsData, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        jobs (
          title,
          job_type,
          wage,
          shop_id
        ),
        profiles (
          full_name,
          phone,
          bio
        )
      `)
      .eq('jobs.shop_id', shopData.id)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
      toast.error('Failed to fetch applications');
      setLoading(false);
      return;
    }

    setApplications(applicationsData || []);
    setLoading(false);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success('Application status updated');
    fetchApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'reviewed': return 'secondary';
      case 'accepted': return 'success';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Job Applications</h1>
              <p className="text-muted-foreground">
                {shop?.name} - {applications.length} total applications
              </p>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {applications.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground">
                  When people apply for your jobs, they'll appear here.
                </p>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} className="p-6 hover:shadow-glow transition-all">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {application.profiles?.full_name?.[0]?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {application.profiles?.full_name || 'Anonymous Applicant'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Applied for: {application.jobs?.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(application.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{application.jobs?.job_type}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary font-semibold">{application.jobs?.wage}</span>
                      </div>
                      {application.profiles?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{application.profiles.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {application.message && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Application Message:</p>
                        <p className="text-sm text-muted-foreground">{application.message}</p>
                      </div>
                    )}

                    {/* Bio */}
                    {application.profiles?.bio && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-1">About:</p>
                        <p className="text-sm text-muted-foreground">{application.profiles.bio}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusUpdate(application.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {application.profiles?.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${application.profiles.phone}`)}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplications;
