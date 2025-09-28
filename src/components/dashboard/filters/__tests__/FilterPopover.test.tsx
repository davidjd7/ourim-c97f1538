import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { FilterPopover } from '../FilterPopover';
import type { ColumnConfig } from '@/contexts/ColumnVisibilityContext';

const mockOnFilterApplied = vi.fn();
const mockOnClose = vi.fn();

const mockColumn: ColumnConfig = {
  key: 'name',
  label: 'Nom',
  type: 'text',
  visible: true,
  sortable: true,
};

describe('FilterPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render text filter for text columns', () => {
    render(
      <FilterPopover
        column={mockColumn}
        onFilterApplied={mockOnFilterApplied}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filtrer par Nom')).toBeInTheDocument();
  });

  it('should render number range filter for currency columns', () => {
    const currencyColumn: ColumnConfig = {
      ...mockColumn,
      key: 'amount',
      label: 'Montant',
      type: 'currency',
    };

    render(
      <FilterPopover
        column={currencyColumn}
        onFilterApplied={mockOnFilterApplied}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filtrer par Montant')).toBeInTheDocument();
  });

  it('should render date range filter for date columns', () => {
    const dateColumn: ColumnConfig = {
      ...mockColumn,
      key: 'date',
      label: 'Date',
      type: 'date',
    };

    render(
      <FilterPopover
        column={dateColumn}
        onFilterApplied={mockOnFilterApplied}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filtrer par Date')).toBeInTheDocument();
  });

  it('should render select filter for type column', () => {
    const typeColumn: ColumnConfig = {
      ...mockColumn,
      key: 'type',
      label: 'Type',
      type: 'text',
    };

    render(
      <FilterPopover
        column={typeColumn}
        onFilterApplied={mockOnFilterApplied}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filtrer par Type')).toBeInTheDocument();
  });

  it('should render tags filter for tags column', () => {
    const tagsColumn: ColumnConfig = {
      ...mockColumn,
      key: 'tags',
      label: 'Tags',
      type: 'text',
    };

    render(
      <FilterPopover
        column={tagsColumn}
        onFilterApplied={mockOnFilterApplied}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filtrer par Tags')).toBeInTheDocument();
  });
});