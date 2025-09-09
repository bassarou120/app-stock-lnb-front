import { TestBed } from '@angular/core/testing';

import { ArticleExerciceService } from './article-exercice.service';

describe('ArticleExerciceService', () => {
  let service: ArticleExerciceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArticleExerciceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
