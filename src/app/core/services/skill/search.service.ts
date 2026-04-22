import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SearchConfig {
  fields: string[];         
  filters?: FilterConfig[];
}

export interface FilterConfig {
  field: string;            
  label: string;            
  options: string[];        
}

export interface ActiveFilter {
  field: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {

 
  createSearch<T>(config: SearchConfig) {

    const querySubject   = new BehaviorSubject<string>('');
    const filtersSubject = new BehaviorSubject<ActiveFilter[]>([]);
    const dataSubject    = new BehaviorSubject<T[]>([]);

    const results$: Observable<T[]> = combineLatest([
      querySubject.pipe(debounceTime(250), distinctUntilChanged()),
      filtersSubject,
      dataSubject
    ]).pipe(
      map(([query, filters, data]) =>
        this.applySearch(data, query, filters, config.fields)
      )
    );

    return {
      results$,
      config,

      
      setData: (data: T[]) => dataSubject.next(data),

      setQuery: (q: string) => querySubject.next(q),

     
      setFilter: (field: string, value: string) => {
        const current = filtersSubject.getValue().filter(f => f.field !== field);
        if (value) current.push({ field, value });
        filtersSubject.next(current);
      },

      reset: () => {
        querySubject.next('');
        filtersSubject.next([]);
      },

     
      getQuery: () => querySubject.getValue(),
      getFilters: () => filtersSubject.getValue(),
    };
  }

 
  private applySearch<T>(
    data: T[],
    query: string,
    filters: ActiveFilter[],
    fields: string[]
  ): T[] {
    let result = [...data];

    for (const filter of filters) {
      if (!filter.value) continue;
      result = result.filter(item => {
        const val = this.getNestedValue(item, filter.field);
        return val?.toString().toLowerCase() === filter.value.toLowerCase();
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(item =>
        fields.some(field => {
          const val = this.getNestedValue(item, field);
          return val?.toString().toLowerCase().includes(q);
        })
      );
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}