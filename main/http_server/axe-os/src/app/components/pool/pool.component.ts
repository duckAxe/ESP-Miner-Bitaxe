import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { startWith, takeUntil, Subject } from 'rxjs';
import { LoadingService } from 'src/app/services/loading.service';
import { SystemService } from 'src/app/services/system.service';

type PoolType = 'stratum' | 'fallbackStratum';
type PresetPool = { name: string, value: { url: string, port: number } | {} };

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {
  public form!: FormGroup;
  public savedChanges: boolean = false;

  public pools: PoolType[] = ['stratum', 'fallbackStratum'];
  public showPassword = {'stratum': false, 'fallbackStratum': false};

  private destroy$ = new Subject<void>();

  @Input() uri = '';

  constructor(
    private fb: FormBuilder,
    private systemService: SystemService,
    private toastr: ToastrService,
    private loadingService: LoadingService
  ) {

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.systemService.getInfo(this.uri)
      .pipe(
        this.loadingService.lockUIUntilComplete()
      )
      .subscribe(info => {
        this.form = this.fb.group({
          stratumPool: {},
          stratumURL: [info.stratumURL, [
            Validators.required,
            Validators.pattern(/^(?!.*stratum\+tcp:\/\/).*$/),
            Validators.pattern(/^[^:]*$/),
          ]],
          stratumPort: [info.stratumPort, [
            Validators.required,
            Validators.pattern(/^[^:]*$/),
            Validators.min(0),
            Validators.max(65535)
          ]],
          stratumExtranonceSubscribe: [info.stratumExtranonceSubscribe == 1, [Validators.required]],
          stratumSuggestedDifficulty: [info.stratumSuggestedDifficulty, [Validators.required]],
          stratumUser: [info.stratumUser, [Validators.required]],
          stratumPassword: ['*****', [Validators.required]],

          fallbackStratumPool: {},
          fallbackStratumURL: [info.fallbackStratumURL, [
            Validators.pattern(/^(?!.*stratum\+tcp:\/\/).*$/),
          ]],
          fallbackStratumPort: [info.fallbackStratumPort, [
            Validators.required,
            Validators.pattern(/^[^:]*$/),
            Validators.min(0),
            Validators.max(65535)
          ]],
          fallbackStratumExtranonceSubscribe: [info.fallbackStratumExtranonceSubscribe == 1, [Validators.required]],
          fallbackStratumSuggestedDifficulty: [info.fallbackStratumSuggestedDifficulty, [Validators.required]],
          fallbackStratumUser: [info.fallbackStratumUser, [Validators.required]],
          fallbackStratumPassword: ['*****', [Validators.required]]
        });

        this.selectCurrentPool();
        this.observeCurrentPool();
      });
  }

  public updateSystem() {
    const form = this.form.getRawValue();

    if (form.stratumPassword === '*****') {
      delete form.stratumPassword;
    }
    if (form.fallbackStratumPassword === '*****') {
      delete form.fallbackStratumPassword;
    }

    this.systemService.updateSystem(this.uri, form)
      .pipe(this.loadingService.lockUIUntilComplete())
      .subscribe({
        next: () => {
          const successMessage = this.uri ? `Saved pool settings for ${this.uri}` : 'Saved pool settings';
          this.toastr.warning('You must restart this device after saving for changes to take effect', 'Warning');
          this.toastr.success(successMessage, 'Success!');
          this.savedChanges = true;
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = this.uri ? `Could not save pool settings for ${this.uri}. ${err.message}` : `Could not save pool settings. ${err.message}`;
          this.toastr.error(errorMessage, 'Error');
          this.savedChanges = false;
        }
      });
  }

  public restart() {
    this.systemService.restart(this.uri)
      .pipe(this.loadingService.lockUIUntilComplete())
      .subscribe({
        next: () => {
          const successMessage = this.uri ? `Bitaxe at ${this.uri} restarted` : 'Bitaxe restarted';
          this.toastr.success(successMessage, 'Success');
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = this.uri ? `Failed to restart device at ${this.uri}. ${err.message}` : `Failed to restart device. ${err.message}`;
          this.toastr.error(errorMessage, 'Error');
        }
      });
  }

  private selectCurrentPool() {
    this.pools.forEach(pool => {
      const urlControl = this.form.controls[`${pool}URL`];
      const portControl = this.form.controls[`${pool}Port`];
      const url = urlControl.value;
      const port = portControl.value;

      if (!url || !port) {
        return;
      }

      if (this.presetPools.some(
        x => 'url' in x.value && x.value.url === url && 'port' in x.value && x.value.port === port
      )) {
        this.form.controls[`${pool}Pool`].setValue({ url, port });
      }
    });
  }

  private observeCurrentPool() {
    this.pools.forEach(pool => {
      const urlControl = this.form.controls[`${pool}URL`];
      const portControl = this.form.controls[`${pool}Port`];
      const poolControl = this.form.controls[`${pool}Pool`];

      poolControl.valueChanges.pipe(
        startWith(poolControl.value),
        takeUntil(this.destroy$)
      ).subscribe(value => {
        if (!value) return;

        const { url, port } = value;

        if (!url || !port) {
          return;
        }

        if (urlControl.value === url && portControl.value === port) {
          return;
        }

        this.form.patchValue(
          { [`${pool}URL`]: url, [`${pool}Port`]: port },
          { emitEvent: false }
        );

        urlControl.markAsDirty();
        portControl.markAsDirty();
      });
    });
  }

  get presetPools(): PresetPool[] {
    const pools = [
      { name: 'Public Pool', value: { url: 'public-pool.io', port: 21496 } },
      { name: 'OCEAN', value: { url: 'mine.ocean.xyz', port: 3334 } },
      { name: 'Solo CKPool', value: { url: 'solo.ckpool.org', port: 3333 } },
      { name: 'Solo CKPool EU', value: { url: 'eusolo.ckpool.org', port: 3333 } },
      { name: 'Noderunners', value: { url: 'pool.noderunners.network', port: 1337 } },
      { name: 'Satoshi Radio', value: { url: 'pool.satoshiradio.nl', port: 3333 } },
      { name: 'SoloHash', value: { url: 'solo.solohash.co.uk', port: 3333 } },
      { name: 'Nerdminer', value: { url: 'pool.nerdminer.de', port: 3333 } },
      { name: 'Solomining', value: { url: 'pool.solomining.de', port: 3333 } },
      { name: 'Blitz Pool', value: { url: 'blitzpool.yourdevice.ch', port: 3333 } },
      { name: 'Braiins Solo', value: { url: 'solo.stratum.braiins.com', port: 3333 } },
      { name: 'Parasite', value: { url: 'parasite.wtf', port: 42069 } },
    ];

    pools.sort((a, b) => a.name.localeCompare(b.name));

    return [
      { name: '- CUSTOM POOL -', value: {} },
      ...pools
    ];
  }
}
