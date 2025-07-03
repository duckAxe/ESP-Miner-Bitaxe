import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest, switchMap, shareReplay, first, takeUntil, map, timer } from 'rxjs';
import { SystemService } from 'src/app/services/system.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ISystemInfo } from 'src/models/ISystemInfo';
import { ISystemASIC } from 'src/models/ISystemASIC';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
})
export class SystemComponent implements OnInit, OnDestroy {
  public info$: Observable<ISystemInfo>;
  public asic$: Observable<ISystemASIC>;
  public combinedData$: Observable<{ info: ISystemInfo, asic: ISystemASIC }>

  private destroy$ = new Subject<void>();

  constructor(
    private systemService: SystemService,
    private loadingService: LoadingService,
  ) {
    this.info$ = timer(0, 5000).pipe(
      switchMap(() => this.systemService.getInfo()),
      shareReplay(1)
    );

    this.asic$ = this.systemService.getAsicSettings().pipe(
      shareReplay(1)
    );

    this.combinedData$ = combineLatest([this.info$, this.asic$]).pipe(
      map(([info, asic]) => ({ info, asic }))
    );
  }

  ngOnInit() {
    this.loadingService.loading$.next(true);

    this.combinedData$
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadingService.loading$.next(false)
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getWifiRssiColor(rssi: number): string {
    if (rssi > -50) return 'text-green-500';
    if (rssi <= -50 && rssi > -60) return 'text-blue-500';
    if (rssi <= -60 && rssi > -70) return 'text-orange-500';

    return 'text-red-500';
  }

  getWifiRssiTooltip(rssi: number): string {
    if (rssi > -50) return 'Excellent';
    if (rssi <= -50 && rssi > -60) return 'Good';
    if (rssi <= -60 && rssi > -70) return 'Fair';

    return 'Weak';
  }
}
