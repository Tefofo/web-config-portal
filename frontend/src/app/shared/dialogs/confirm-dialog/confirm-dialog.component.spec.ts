import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  const closed: boolean[] = [];
  const dialogRef = { close: (v: boolean) => closed.push(v) };
  const data: ConfirmDialogData = {
    title: 'Delete Configuration',
    message: 'Are you sure?',
    confirmLabel: 'Delete',
    danger: true,
  };

  function create() {
    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    return TestBed.createComponent(ConfirmDialogComponent);
  }

  beforeEach(() => {
    closed.length = 0;
  });

  it('closes with true when confirmed', () => {
    const fixture = create();
    fixture.componentInstance.confirm();
    expect(closed).toEqual([true]);
  });

  it('closes with false when cancelled', () => {
    const fixture = create();
    fixture.componentInstance.cancel();
    expect(closed).toEqual([false]);
  });

  it('exposes the injected dialog data', () => {
    const fixture = create();
    expect(fixture.componentInstance.data.title).toBe('Delete Configuration');
    expect(fixture.componentInstance.data.danger).toBe(true);
  });
});
