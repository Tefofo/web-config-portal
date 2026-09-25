import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfigurationFormComponent } from './configuration-form.component';

describe('ConfigurationFormComponent (validation)', () => {
  let httpMock: HttpTestingController;

  function createComponent() {
    TestBed.configureTestingModule({
      imports: [ConfigurationFormComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(ConfigurationFormComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // The component loads reference data (environments + users) and existing
    // configurations on construction; satisfy those requests.
    flushInitialRequests();
    return fixture;
  }

  function flushInitialRequests() {
    httpMock.match(() => true).forEach((req) => {
      if (req.request.url.includes('/environments')) {
        req.flush([]);
      } else if (req.request.url.includes('/users')) {
        req.flush({ items: [], total: 0, page: 1, pageSize: 1000 });
      } else if (req.request.url.includes('/configurations')) {
        req.flush({
          items: [
            {
              id: 'cfg-1',
              key: 'existing.key',
              environmentId: 'env-dev',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 1000,
        });
      } else {
        req.flush({});
      }
    });
  }

  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
  });

  it('is invalid when required fields are empty', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.form.valid).toBe(false);
  });

  it('rejects an invalid key format', () => {
    const fixture = createComponent();
    const key = fixture.componentInstance.form.controls.key;
    key.setValue('Invalid Key!');
    expect(key.hasError('pattern')).toBe(true);
  });

  it('accepts a well-formed key', () => {
    const fixture = createComponent();
    const key = fixture.componentInstance.form.controls.key;
    key.setValue('feature.new_flag');
    expect(key.hasError('pattern')).toBe(false);
  });

  it('flags a duplicate key that already exists', () => {
    const fixture = createComponent();
    const form = fixture.componentInstance.form;
    form.controls.environmentId.setValue('env-dev');
    form.controls.key.setValue('existing.key');
    form.controls.key.updateValueAndValidity();
    expect(form.controls.key.hasError('duplicateKey')).toBe(true);
  });
});
