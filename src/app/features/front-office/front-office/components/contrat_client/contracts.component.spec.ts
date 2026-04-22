import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ContractsComponent } from './contracts.component';
import { ContractService } from 'src/app/core/services/contract.service';

fdescribe('ContractsComponent', () => {
	let component: ContractsComponent;
	let fixture: ComponentFixture<ContractsComponent>;
	let contractServiceSpy: jasmine.SpyObj<ContractService>;

	beforeEach(async () => {
		const spy = jasmine.createSpyObj('ContractService', [
			'getAllContracts',
			'initMilestonePayment',
			'simulatePayment',
		]);

		await TestBed.configureTestingModule({
			declarations: [ContractsComponent],
			imports: [HttpClientTestingModule, RouterTestingModule],
			providers: [{ provide: ContractService, useValue: spy }],
			// On ignore le template complexe (CDK Portal, etc.) pour avoir des tests unitaires simples
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ContractsComponent);
		component = fixture.componentInstance;
		contractServiceSpy = TestBed.inject(
			ContractService
		) as jasmine.SpyObj<ContractService>;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should filter contracts by status and search query', () => {
		component.contracts = [
			{
				id: 1,
				title: 'Contract A',
				description: 'First contract',
				projectId: 1,
				proposalId: 1,
				clientId: 10,
				freelancerId: 100,
				totalAmount: 100,
				currency: 'TND',
				startDate: '2026-04-01',
				endDate: '2026-04-30',
				status: 'ACTIVE',
				milestones: [],
			},
			{
				id: 2,
				title: 'Second',
				description: 'Other one',
				projectId: 1,
				proposalId: 2,
				clientId: 10,
				freelancerId: 101,
				totalAmount: 200,
				currency: 'TND',
				startDate: '2026-05-01',
				endDate: '2026-05-31',
				status: 'DRAFT',
				milestones: [],
			},
		] as any;

		// filtre par statut
		component.statusFilter = 'ACTIVE';
		component.searchQuery = '';
		component.applyFilters();

		expect(component.filteredContracts.length).toBe(1);
		expect(component.filteredContracts[0].status).toBe('ACTIVE');

		// filtre par texte
		component.statusFilter = '';
		component.searchQuery = 'second';
		component.applyFilters();

		expect(component.filteredContracts.length).toBe(1);
		expect(component.filteredContracts[0].title).toBe('Second');
	});

	it('should call payment API when paying a valid milestone', () => {
		const milestone: any = { id: 1, status: 'PENDING', amount: 50 };
		const contract: any = { id: 10, status: 'ACTIVE', milestones: [milestone] };

		// Simuler un client connecté pour que currentClientId \> 0
		localStorage.setItem('userId', '123');

		spyOn(component, 'loadContracts');

		contractServiceSpy.initMilestonePayment.and.returnValue(
			of({ paymentId: 123, amount: 50, status: 'PENDING', redirectUrl: 'http://fake' })
		);
		contractServiceSpy.simulatePayment.and.returnValue(
			of({ paymentId: 123, status: 'COMPLETED', paidAt: '2026-04-15T00:00:00' })
		);

		const fakeEvent = new MouseEvent('click');

		component.payMilestone(milestone, contract, fakeEvent);

		expect(contractServiceSpy.initMilestonePayment).toHaveBeenCalled();
		expect(contractServiceSpy.simulatePayment).toHaveBeenCalledWith(123, true);
		expect(component.loadContracts).toHaveBeenCalled();
	});
});

