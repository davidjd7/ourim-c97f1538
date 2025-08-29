import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Filter, User, FileText, DollarSign, Edit, AlertCircle } from 'lucide-react';

interface HistoryEvent {
  id: string;
  type: 'status_change' | 'value_update' | 'document_added' | 'note_added' | 'payment' | 'edit';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  oldValue?: string;
  newValue?: string;
  amount?: number;
}

interface HistoriqueTabProps {
  investmentId: string;
}

const mockHistory: HistoryEvent[] = [
  {
    id: '1',
    type: 'status_change',
    title: 'Statut modifié',
    description: 'Statut changé de "Due Dil" à "Investi"',
    timestamp: '2024-01-15T14:30:00Z',
    user: 'D. Dahan',
    oldValue: 'Due Dil',
    newValue: 'Investi'
  },
  {
    id: '2',
    type: 'value_update',
    title: 'Valeur mise à jour',
    description: 'Réévaluation trimestrielle de la valeur',
    timestamp: '2024-01-10T09:15:00Z',
    user: 'A. Dahan',
    oldValue: '2,120,000 €',
    newValue: '2,170,000 €'
  },
  {
    id: '3',
    type: 'document_added',
    title: 'Document ajouté',
    description: 'Ajout du rapport financier Q4',
    timestamp: '2024-01-05T16:45:00Z',
    user: 'A. Dahan'
  },
  {
    id: '4',
    type: 'payment',
    title: 'Versement reçu',
    description: 'Loyers du 4ème trimestre',
    timestamp: '2023-12-15T08:00:00Z',
    user: 'System',
    amount: 16000
  },
  {
    id: '5',
    type: 'note_added',
    title: 'Note ajoutée',
    description: 'Note de due diligence créée',
    timestamp: '2023-12-01T11:20:00Z',
    user: 'A. Dahan'
  },
  {
    id: '6',
    type: 'edit',
    title: 'Informations modifiées',
    description: 'Mise à jour de l\'adresse et de la surface',
    timestamp: '2023-11-20T13:10:00Z',
    user: 'D. Dahan'
  }
];

const eventTypeConfig = {
  status_change: {
    label: 'Changement de statut',
    icon: AlertCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  value_update: {
    label: 'Mise à jour valeur',
    icon: DollarSign,
    className: 'bg-green-50 text-green-700 border-green-200'
  },
  document_added: {
    label: 'Document ajouté',
    icon: FileText,
    className: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  note_added: {
    label: 'Note ajoutée',
    icon: FileText,
    className: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  payment: {
    label: 'Paiement',
    icon: DollarSign,
    className: 'bg-success-lighter text-success border-success-light'
  },
  edit: {
    label: 'Modification',
    icon: Edit,
    className: 'bg-gray-50 text-gray-700 border-gray-200'
  }
};

export function HistoriqueTab({ investmentId }: HistoriqueTabProps) {
  const [history, setHistory] = useState<HistoryEvent[]>(mockHistory);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredHistory = history.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
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
                  <SelectItem value="status_change">Changements de statut</SelectItem>
                  <SelectItem value="value_update">Mises à jour valeur</SelectItem>
                  <SelectItem value="document_added">Documents ajoutés</SelectItem>
                  <SelectItem value="note_added">Notes ajoutées</SelectItem>
                  <SelectItem value="payment">Paiements</SelectItem>
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
              const IconComponent = eventTypeConfig[event.type].icon;
              
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
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant="outline" className={eventTypeConfig[event.type].className}>
                          {eventTypeConfig[event.type].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{event.user}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(event.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">{event.description}</p>
                    
                    {/* Additional details based on event type */}
                    {event.oldValue && event.newValue && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded">
                          {event.oldValue}
                        </span>
                        <span>→</span>
                        <span className="bg-success/10 text-success px-2 py-1 rounded">
                          {event.newValue}
                        </span>
                      </div>
                    )}
                    
                    {event.amount && (
                      <div className="text-sm font-medium text-success">
                        + {formatCurrency(event.amount)}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(event.timestamp).toLocaleDateString('fr-FR', {
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
                Aucun événement trouvé pour les critères sélectionnés
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}