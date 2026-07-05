import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-auth-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModal implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('authDialog') dialogRef!: ElementRef<HTMLDialogElement>;
  mode: 'login' | 'register' = 'login';
  username = '';
  password = '';
  confirmPassword = '';
  error = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    if (this.dialogRef?.nativeElement) {
      this.dialogRef.nativeElement.showModal();
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error = '';
    this.cdr.markForCheck();
  }

  submit(): void {
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Заполните все поля';
      return;
    }

    if (this.mode === 'register') {
      if (this.password.length < 6) {
        this.error = 'Пароль должен быть не менее 6 символов';
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.error = 'Пароли не совпадают';
        return;
      }
      this.isLoading = true;
      this.auth.register({ username: this.username, password: this.password }).subscribe({
        next: () => this.doLogin(),
        error: (err) => this.handleError(err, 'Ошибка регистрации'),
      });
    } else {
      this.isLoading = true;
      this.doLogin();
    }
  }

  private doLogin(): void {
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.close.emit();
      },
      error: (err) => this.handleError(err, 'Неверное имя пользователя или пароль'),
    });
  }

  private handleError(err: any, fallback: string): void {
    this.isLoading = false;
    this.error = err?.error?.detail ?? fallback;
    this.cdr.markForCheck();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}
