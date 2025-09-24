import { TestBed } from '@angular/core/testing';

import { ExerciceMouvementTicketService } from './exercice-mouvementTicket.service';

describe('ExerciceMouvementTicketService', () => {
  let service: ExerciceMouvementTicketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciceMouvementTicketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
