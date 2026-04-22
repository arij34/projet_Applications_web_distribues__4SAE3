import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ContratFreelancerComponent } from './contrat-freelancer.component';
import { ContractService } from 'src/app/core/services/contract.service';
import { AuthService } from 'src/app/core/auth/auth.service';

fdescribe('ContratFreelancerComponent', () => {
  let component: ContratFreelancerComponent;
  let fixture: ComponentFixture<ContratFreelancerComponent>;
  let contractServiceSpy: jasmine.SpyObj<ContractService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const contractSpy = jasmine.createSpyObj('ContractService', [
      'getAllContracts',
      'getContractById',
      'acceptClientProposal',
      'pushNotification',
      'getStatusLabel',
      'getStatusClass',
      'formatDate',
      'formatAmount',
      'getMilestonesProgress',
      'markAllRead',
    ], { notifications$: of([]) });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser']);

    await TestBed.configureTestingModule({
      declarations: [ContratFreelancerComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ContractService, useValue: contractSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratFreelancerComponent);
    component = fixture.componentInstance;
    contractServiceSpy = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter contracts by status and search query for freelancer', () => {
    // simulate logged-in freelancer
    localStorage.setItem('userId', '42');

    const contracts: any[] = [
      {
        id: 1,
        title: 'Draft contract',
        description: 'First',
        clientName: 'Client A',
        freelancerId: 42,
        status: 'DRAFT',
      },
      {
        id: 2,
        title: 'Active contract',
        description: 'Second',
        clientName: 'Client B',
        freelancerId: 42,
        status: 'ACTIVE',
      },
      {
        id: 3,
        title: 'Other freelancer',
        description: 'Third',
        clientName: 'Client C',
        freelancerId: 99,
        status: 'DRAFT',
      },
    ];

    contractServiceSpy.getAllContracts.and.returnValue(of(contracts));

    // passer par le cycle normal d'init pour que freelancerId
    // soit lu depuis le localStorage et appliqué dans loadContracts
    component.ngOnInit();

    // après chargement, seuls les contrats du freelancer 42 doivent être pris
    expect(component.contracts.length).toBe(2);

    // filtre par statut
    component.activeFilter = 'DRAFT';
    component.searchQuery = '';
    component.applyFilters();
    expect(component.filteredContracts.length).toBe(1);
    expect(component.filteredContracts[0].status).toBe('DRAFT');

    // filtre par recherche texte
    component.activeFilter = 'ALL';
    component.searchQuery = 'active';
    component.applyFilters();
    expect(component.filteredContracts.length).toBe(1);
    expect(component.filteredContracts[0].title).toBe('Active contract');
  });

  it('should call acceptClientProposal and update status on acceptProposal', () => {
    const contract: any = {
      id: 10,
      title: 'To accept',
      status: 'DRAFT',
      freelancerId: 42,
    };

    component.contracts = [contract];
    component.filteredContracts = [contract];

    contractServiceSpy.acceptClientProposal.and.returnValue(of({ status: 'PENDING_SIGNATURE' }));

    const fakeEvent = new MouseEvent('click');

    component.acceptProposal(contract, fakeEvent);

    expect(contractServiceSpy.acceptClientProposal).toHaveBeenCalledWith(10);
    expect(component.contracts[0].status).toBe('PENDING_SIGNATURE');
  });
});
