import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@/test/utils';
import { useContext } from 'react';
import { ColumnFiltersProvider, ColumnFiltersContext } from '../ColumnFiltersContext';

// Test component to access context
function TestComponent() {
  const context = useContext(ColumnFiltersContext);
  
  if (!context) {
    return <div>No context</div>;
  }

  const { filters, setColumnFilter, clearColumnFilter, clearAllFilters } = context;

  return (
    <div>
      <div data-testid="filters-count">{Object.keys(filters).length}</div>
      <button onClick={() => setColumnFilter('name', { text: 'test' })}>
        Add Filter
      </button>
      <button onClick={() => clearColumnFilter('name')}>
        Remove Filter
      </button>
      <button onClick={clearAllFilters}>
        Clear All
      </button>
      {filters.name && (
        <div data-testid="name-filter">{filters.name.value.text}</div>
      )}
    </div>
  );
}

describe('ColumnFiltersContext', () => {
  it('should provide filters context', () => {
    render(
      <ColumnFiltersProvider>
        <TestComponent />
      </ColumnFiltersProvider>
    );

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should add filters', async () => {
    render(
      <ColumnFiltersProvider>
        <TestComponent />
      </ColumnFiltersProvider>
    );

    const addButton = screen.getByText('Add Filter');
    
    await act(async () => {
      addButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');
    expect(screen.getByTestId('name-filter')).toHaveTextContent('test');
  });

  it('should remove filters', async () => {
    render(
      <ColumnFiltersProvider>
        <TestComponent />
      </ColumnFiltersProvider>
    );

    const addButton = screen.getByText('Add Filter');
    const removeButton = screen.getByText('Remove Filter');
    
    // Add filter first
    await act(async () => {
      addButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');

    // Remove filter
    await act(async () => {
      removeButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should clear all filters', async () => {
    render(
      <ColumnFiltersProvider>
        <TestComponent />
      </ColumnFiltersProvider>
    );

    const addButton = screen.getByText('Add Filter');
    const clearButton = screen.getByText('Clear All');
    
    // Add filter first
    await act(async () => {
      addButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');

    // Clear all filters
    await act(async () => {
      clearButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should handle multiple filters', async () => {
    function MultiFilterTest() {
      const context = useContext(ColumnFiltersContext);
      
      if (!context) return <div>No context</div>;

      const { filters, setColumnFilter } = context;

      return (
        <div>
          <div data-testid="filters-count">{Object.keys(filters).length}</div>
          <button onClick={() => {
            setColumnFilter('name', { text: 'test1' });
            setColumnFilter('type', { text: 'test2' });
            setColumnFilter('amount', { numberRange: { min: 100, max: 200 } });
          }}>
            Add Multiple
          </button>
        </div>
      );
    }

    render(
      <ColumnFiltersProvider>
        <MultiFilterTest />
      </ColumnFiltersProvider>
    );

    const addButton = screen.getByText('Add Multiple');
    
    await act(async () => {
      addButton.click();
    });

    expect(screen.getByTestId('filters-count')).toHaveTextContent('3');
  });
});