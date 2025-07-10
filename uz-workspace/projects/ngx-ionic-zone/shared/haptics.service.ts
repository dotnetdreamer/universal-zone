import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Platform } from '@ionic/angular';

export interface HapticOptions {
  /**
   * Enable or disable haptic feedback
   */
  enabled?: boolean;
  /**
   * Fallback to vibration on unsupported devices
   */
  fallbackToVibration?: boolean;
}

export enum HapticPattern {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Selection = 'selection'
}

@Injectable({
  providedIn: 'root'
})
export class HapticsService {
  private options: HapticOptions = {
    enabled: true,
    fallbackToVibration: true
  };

  constructor(private platform: Platform) {}

  /**
   * Configure haptic feedback options
   */
  configure(options: Partial<HapticOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Play haptic feedback based on pattern
   */
  async play(pattern: HapticPattern): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      switch (pattern) {
        case HapticPattern.Light:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        
        case HapticPattern.Medium:
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        
        case HapticPattern.Heavy:
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        
        case HapticPattern.Success:
          await Haptics.notification({ type: NotificationType.Success });
          break;
        
        case HapticPattern.Warning:
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        
        case HapticPattern.Error:
          await Haptics.notification({ type: NotificationType.Error });
          break;
        
        case HapticPattern.Selection:
          await Haptics.selectionStart();
          break;
        
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      
      // Fallback to vibration if haptics are not supported
      if (this.options.fallbackToVibration && this.platform.is('mobile')) {
        this.vibrate(pattern);
      }
    }
  }

  /**
   * Play product selection haptic feedback
   */
  async light(): Promise<void> {
    await this.play(HapticPattern.Light);
  }

  /**
   * Play product add to cart haptic feedback
   */
  async medium(): Promise<void> {
    await this.play(HapticPattern.Medium);
  }

  /**
   * Play order submission haptic feedback
   */
  async heavy(): Promise<void> {
    await this.play(HapticPattern.Heavy);
  }

  /**
   * Play order success haptic feedback
   */
  async success(): Promise<void> {
    await this.play(HapticPattern.Success);
  }

  /**
   * Play order error haptic feedback
   */
  async orderError(): Promise<void> {
    await this.play(HapticPattern.Error);
  }

  /**
   * Play button interaction haptic feedback
   */
  async buttonInteraction(): Promise<void> {
    await this.play(HapticPattern.Selection);
  }

  /**
   * Play custom haptic pattern
   */
  async customImpact(style: ImpactStyle): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Custom haptic impact failed:', error);
    }
  }

  /**
   * Play custom notification haptic
   */
  async customNotification(type: NotificationType): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.warn('Custom haptic notification failed:', error);
    }
  }

  /**
   * Check if haptics are available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to perform a test haptic
      await Haptics.impact({ style: ImpactStyle.Light });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disable haptic feedback
   */
  disable(): void {
    this.options.enabled = false;
  }

  /**
   * Enable haptic feedback
   */
  enable(): void {
    this.options.enabled = true;
  }

  /**
   * Fallback vibration for unsupported devices
   */
  private vibrate(pattern: HapticPattern): void {
    if (!navigator.vibrate) {
      return;
    }

    const vibrationPatterns: Record<HapticPattern, number | number[]> = {
      [HapticPattern.Light]: 50,
      [HapticPattern.Medium]: 100,
      [HapticPattern.Heavy]: 200,
      [HapticPattern.Success]: [100, 50, 100],
      [HapticPattern.Warning]: [150, 100, 150],
      [HapticPattern.Error]: [200, 100, 200, 100, 200],
      [HapticPattern.Selection]: 25
    };

    const vibrationPattern = vibrationPatterns[pattern];
    if (Array.isArray(vibrationPattern)) {
      navigator.vibrate(vibrationPattern);
    } else {
      navigator.vibrate(vibrationPattern);
    }
  }
}
