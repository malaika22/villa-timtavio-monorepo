export enum GuestTierEnum {
  primary = 'primary',
  secondary = 'secondary',
}

export type GuestTier = GuestTierEnum.primary | GuestTierEnum.secondary;
