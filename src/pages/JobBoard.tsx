import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, MapPin, DollarSign, Clock, Search, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getJobImage } from '@/lib/jobData';

const JobBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [wageFilter, setWageFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*, shops(name, address, category)')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch jobs');
      setIsLoading(false);
      return;
    }

    setJobs(data || []);
    setIsLoading(false);
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply for jobs');
      navigate('/auth');
      return;
    }

    if (!selectedJob) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('job_applications')
        .insert([
          {
            job_id: selectedJob.id,
            user_id: user.id,
            message: applicationMessage,
            status: 'pending',
          }
        ]);

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You have already applied for this job');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
      setApplicationMessage('');
      setSelectedJob(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.shops?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobType = jobTypeFilter === 'all' || job.job_type === jobTypeFilter;
    
    const matchesWage = wageFilter === 'all' || (() => {
      const wage = job.wage.toLowerCase();
      if (wageFilter === 'low') return wage.includes('300') || wage.includes('5000') || wage.includes('8000');
      if (wageFilter === 'medium') return wage.includes('10000') || wage.includes('15000');
      if (wageFilter === 'high') return wage.includes('20000') || parseFloat(wage.replace(/[^0-9]/g, '')) > 20000;
      return true;
    })();
    
    return matchesSearch && matchesJobType && matchesWage;
  });

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full hover:scale-110 transition-all hover:shadow-glow"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Local Job Board</h1>
                <p className="text-muted-foreground">
                  Find part-time and full-time opportunities in your community
                </p>
              </div>
            </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs or shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={wageFilter} onValueChange={setWageFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <DollarSign className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pay Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="low">₹300-8,000</SelectItem>
                <SelectItem value="medium">₹10,000-15,000</SelectItem>
                <SelectItem value="high">₹20,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job, index) => (
              <Card 
                key={job.id} 
                className="overflow-hidden hover:shadow-glow transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/shop/${job.shop_id}`)}
              >
                {/* Job Image */}
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={getJobImage(job.title)} 
                    alt={job.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  <Badge variant="outline" className="absolute top-3 right-3 bg-background/90">
                    {job.job_type}
                  </Badge>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-sm text-primary hover:underline">{job.shops?.name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{job.wage}</span>
                  </div>
                  {job.shift_hours && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{job.shift_hours}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{job.shops?.address}</span>
                  </div>
                </div>

                {job.description && (
                  <p className="text-sm line-clamp-2 text-muted-foreground">{job.description}</p>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                    setApplyDialogOpen(true);
                  }}
                    className="w-full hover:shadow-glow transition-all"
                  >
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No jobs found matching your search</p>
            </div>
          )}
        </div>
      </div>
      )}

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Why are you interested in this position?</label>
              <Textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell us about your interest and experience..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleApply}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobBoard;
