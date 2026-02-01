'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { createHackathon } from '@/lib/firestore';
import { HackathonEvent } from '@/lib/types';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface CreateHackathonDialogProps {
  children: React.ReactNode;
  onHackathonCreated?: (hackathon: HackathonEvent) => void;
}

export function CreateHackathonDialog({ children, onHackathonCreated }: CreateHackathonDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxTeams, setMaxTeams] = useState('50');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [theme, setTheme] = useState('');
  const [prizes, setPrizes] = useState<string[]>(['']);
  const [rules, setRules] = useState<string[]>(['']);

  if (!user) return null;

  const handleAddPrize = () => {
    setPrizes(prev => [...prev, '']);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrizeChange = (index: number, value: string) => {
    setPrizes(prev => prev.map((prize, i) => i === index ? value : prize));
  };

  const handleAddRule = () => {
    setRules(prev => [...prev, '']);
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, value: string) => {
    setRules(prev => prev.map((rule, i) => i === index ? value : rule));
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Hackathon name is required';
    if (!description.trim()) return 'Description is required';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    if (new Date(startDate) >= new Date(endDate)) return 'End date must be after start date';
    if (parseInt(maxTeams) < 1) return 'Maximum teams must be at least 1';
    if (parseInt(maxTeamSize) < 1) return 'Maximum team size must be at least 1';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const hackathonData = {
        name: name.trim(),
        description: description.trim(),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        theme: theme.trim() || '',
        max_team_size: parseInt(maxTeamSize),
        prizes: prizes.filter(p => p.trim().length > 0),
        rules: rules.filter(r => r.trim().length > 0),
        organizer: user.displayName || user.email || '',
        status: 'upcoming' as const,
      };

      const newHackathon = await createHackathon(hackathonData);
      
      if (onHackathonCreated) {
        onHackathonCreated(newHackathon);
      }

      // Reset form
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setMaxTeams('50');
      setMaxTeamSize('4');
      setTheme('');
      setPrizes(['']);
      setRules(['']);
      setOpen(false);

    } catch (err: any) {
      setError(err.message || 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Hackathon
          </DialogTitle>
          <DialogDescription>
            Set up a new hackathon event for teams to participate in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Hackathon Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Spring 2024 Innovation Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the hackathon theme, goals, and what participants can expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme (Optional)</Label>
              <Input
                id="theme"
                placeholder="e.g., AI for Good, Sustainability, FinTech"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Team Settings */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="1"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeamSize">Maximum Team Size</Label>
                <Input
                  id="maxTeamSize"
                  type="number"
                  min="1"
                  max="10"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Prizes (Optional)
            </h3>
            
            <div className="space-y-2">
              {prizes.map((prize, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Prize ${index + 1} (e.g., $1000 First Place)`}
                    value={prize}
                    onChange={(e) => handlePrizeChange(index, e.target.value)}
                    disabled={loading}
                  />
                  {prizes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePrize(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPrize}
                disabled={loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Prize
              </Button>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            <h3 className="font-medium">Rules & Guidelines (Optional)</h3>
            
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    disabled={loading}
                  />
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveRule(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRule}
                disabled={loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Hackathon
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}