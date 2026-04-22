import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'proposalFilter' })
export class ProposalFilterPipe implements PipeTransform {
  transform(proposals: any[], status: string): number {
    if (!proposals) return 0;
    return proposals.filter(p => p.status === status).length;
  }
}