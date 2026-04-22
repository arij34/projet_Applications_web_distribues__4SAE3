import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ContratFreelancerDetailComponent } from './contrat-freelancer-detail.component';
import { ContractService } from 'src/app/core/services/contract.service';

class ActivatedRouteStub {
  snapshot = { paramMap: { get: (_: string) => '1' } } as any;
}

fdescribe('ContratFreelancerDetailComponent', () => {
  let component: ContratFreelancerDetailComponent;
  let fixture: ComponentFixture<ContratFreelancerDetailComponent>;
  let contractServiceSpy: jasmine.SpyObj<ContractService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const contractSpy = jasmine.createSpyObj('ContractService', [
      'getContractById',
      'getContractHistory',
      'getContractSummary',
      'acceptClientProposal',
      'signContract',
      'submitModifications',
      'updateMilestone',
      'addMilestone',
      'deleteMilestone',
      'updateClause',
      'getStatusLabel',
      'getStatusClass',
      'formatDate',
      'formatAmount',
      'pushNotification',
      'pushActivity',
    ], { activities$: of([]) });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ContratFreelancerDetailComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ContractService, useValue: contractSpy },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratFreelancerDetailComponent);
    component = fixture.componentInstance;
    contractServiceSpy = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contract on init', () => {
    const contract: any = {
      id: 1,
      title: 'Freelancer contract',
      totalAmount: 1000,
      currency: 'TND',
      status: 'DRAFT',
      milestones: [],
      freelancerName: 'F',
      clientName: 'C',
      clientCompany: 'X',
    };

    contractServiceSpy.getContractById.and.returnValue(of(contract));
    contractServiceSpy.getContractHistory.and.returnValue(of([]));
    contractServiceSpy.getContractSummary.and.returnValue(of({ contractId: 1, summary: [] }));

    component.ngOnInit();

    expect(contractServiceSpy.getContractById).toHaveBeenCalledWith(1);
    expect(component.contract).toBeTruthy();
    expect(component.contract!.title).toBe('Freelancer contract');
  });

  it('should accept client proposal when status is DRAFT', () => {
    component.contract = {
      id: 1,
      title: 'To accept',
      status: 'DRAFT',
      totalAmount: 1000,
      currency: 'TND',
    } as any;

    contractServiceSpy.acceptClientProposal.and.returnValue(of({ status: 'PENDING_SIGNATURE' }));
    contractServiceSpy.getContractSummary.and.returnValue(of({ contractId: 1, summary: [] } as any));

    component.acceptClientProposal();

    expect(contractServiceSpy.acceptClientProposal).toHaveBeenCalledWith(1);
    expect(component.contract!.status).toBe('PENDING_SIGNATURE');
  });

  it('should confirm contract content and set local flag', () => {
    component.contract = { id: 5 } as any;

    component.confirmContractContent();

    expect(component.contentConfirmed).toBeTrue();
  });
});
