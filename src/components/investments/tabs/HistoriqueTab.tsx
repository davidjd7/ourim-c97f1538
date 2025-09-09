import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Filter, User, FileText, DollarSign, Edit, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/contexts/CompanyContext';

interface HistoryEvent {
  id: string;
  investment_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  action_type: 'create' | 'update' | 'delete';
  created_at: string;
  user_id: string;
}

interface HistoriqueTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

export function HistoriqueTab({ investmentId }: HistoriqueTabProps) {
  const { user } = useAuth();
  const { companies } = useCompanies();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  // Load history from Supabase with pagination
  const loadHistory = async (resetHistory: boolean = true) => {
    if (!user || !investmentId) return;

    try {
      const currentOffset = resetHistory ? 0 : offset;
      const { data, error } = await supabase
        .from('investment_history')
        .select('*')
        .eq('investment_id', investmentId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1);

      if (error) throw error;
      
      const newHistory = (data || []).map(item => ({
        ...item,
        action_type: item.action_type as 'create' | 'update' | 'delete'
      }));

      if (resetHistory) {
        setHistory(newHistory);
        setOffset(LIMIT);
      } else {
        setHistory(prev => [...prev, ...newHistory]);
        setOffset(prev => prev + LIMIT);
      }
      
      setHasMore(newHistory.length === LIMIT);
    } catch (error) {
      console.error('Error loading investment history:', error);
    } finally {
      if (resetHistory) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user, investmentId]);

  // Helper functions to display history events
  const getEventTitle = (event: HistoryEvent): string => {
    switch (event.action_type) {
      case 'create':
        return 'Investissement créé';
      case 'update':
        return `${getFieldDisplayName(event.field_name)} modifié`;
      case 'delete':
        return 'Investissement supprimé';
      default:
        return 'Modification';
    }
  };

  // Helper function to format values for display
  const formatValueForDisplay = (fieldName: string, value: string | null): string => {
    if (!value) return 'Non défini';
    
    // Convert company_id OR companyId to company name
    if (fieldName === 'company_id' || fieldName === 'companyId') {
      const company = companies.find(c => c.id === value);
      return company ? company.name : `Société inconnue (${value.substring(0, 8)}...)`;
    }
    
    return value;
  };

  const getEventDescription = (event: HistoryEvent): string => {
    switch (event.action_type) {
      case 'create':
        return 'Nouvel investissement ajouté au portefeuille';
      case 'update':
        if (event.old_value && event.new_value) {
          const oldValueFormatted = formatValueForDisplay(event.field_name, event.old_value);
          const newValueFormatted = formatValueForDisplay(event.field_name, event.new_value);
          return `Valeur changée de "${oldValueFormatted}" à "${newValueFormatted}"`;
        }
        return `${getFieldDisplayName(event.field_name)} mis à jour`;
      case 'delete':
        return 'Investissement retiré du portefeuille';
      default:
        return 'Modification apportée';
    }
  };

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: { [key: string]: string } = {
      name: 'Nom',
      status: 'Statut',
      price: 'Prix',
      address: 'Adresse',
      surface: 'Surface',
      date_acquisition: 'Date d\'acquisition',
      locataire: 'Locataire',
      bail_loyer_ht: 'Loyer HT',
      last_value: 'Dernière valeur',
      tri: 'TRI',
      investment_amount: 'Montant d\'investissement',
      notary_fees: 'Frais de notaire',
      company_id: 'Société' // ← AJOUT IMPORTANT
    };
    return fieldMap[fieldName] || fieldName;
  };

  const getEventType = (event: HistoryEvent): string => {
    if (event.action_type === 'create') return 'creation';
    if (event.field_name === 'status') return 'status_change';
    if (event.field_name === 'last_value' || event.field_name === 'tri') return 'value_update';
    return 'edit';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'creation':
        return AlertCircle;
      case 'status_change':
        return AlertCircle;
      case 'value_update':
        return DollarSign;
      default:
        return Edit;
    }
  };

  const getEventBadgeClass = (eventType: string): string => {
    switch (eventType) {
      case 'creation':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'status_change':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'value_update':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getEventBadgeLabel = (eventType: string): string => {
    switch (eventType) {
      case 'creation':
        return 'Création';
      case 'status_change':
        return 'Changement de statut';
      case 'value_update':
        return 'Mise à jour valeur';
      default:
        return 'Modification';
    }
  };

  const filteredHistory = history.filter(event => {
    const eventType = getEventType(event);
    const title = getEventTitle(event);
    const description = getEventDescription(event);
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.field_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || eventType === filterType;
    return matchesSearch && matchesType;
  });

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 24 * 7) {
      return `Il y a ${Math.floor(diffInHours / 24)}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              Chargement de l'historique...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type d'événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  <SelectItem value="creation">Créations</SelectItem>
                  <SelectItem value="status_change">Changements de statut</SelectItem>
                  <SelectItem value="value_update">Mises à jour valeur</SelectItem>
                  <SelectItem value="edit">Modifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chronologie ({filteredHistory.length} événements)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.map((event, index) => {
              const eventType = getEventType(event);
              const IconComponent = getEventIcon(eventType);
              const title = getEventTitle(event);
              const description = getEventDescription(event);
              
              return (
                <div key={event.id} className="relative flex gap-4 pb-4">
                  {/* Timeline line */}
                  {index < filteredHistory.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                  )}
                  
                  {/* Event icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{title}</h3>
                        <Badge variant="outline" className={getEventBadgeClass(eventType)}>
                          {getEventBadgeLabel(eventType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Système</span>
                        <span>•</span>
                        <span>{formatRelativeTime(event.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">{description}</p>
                    
                    {/* Additional details based on event type */}
                    {event.old_value && event.new_value && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded">
                          {formatValueForDisplay(event.field_name, event.old_value)}
                        </span>
                        <span>→</span>
                        <span className="bg-success/10 text-success px-2 py-1 rounded">
                          {formatValueForDisplay(event.field_name, event.new_value)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(event.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Aucun événement trouvé pour les critères sélectionnés'
                  : 'Aucun historique disponible pour cet investissement'
                }
              </div>
            )}
            
            {/* Load More Button */}
            {filteredHistory.length > 0 && hasMore && (searchTerm === '' && filterType === 'all') && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full max-w-xs"
                >
                  {loadingMore ? 'Chargement...' : 'Charger plus d\'événements'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}