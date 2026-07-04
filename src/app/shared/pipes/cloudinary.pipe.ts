import { Pipe, PipeTransform } from '@angular/core';

export type CloudinaryPreset = 'thumb' | 'gallery' | 'lightbox' | 'lightbox-thumb';

const TRANSFORMS: Record<CloudinaryPreset, string> = {
  'thumb':          'f_auto,q_auto,w_400,c_fill,g_auto',
  'gallery':        'f_auto,q_auto,w_800',
  'lightbox':       'f_auto,q_auto,w_1200',
  'lightbox-thumb': 'f_auto,q_auto,w_120,c_fill,g_auto',
};

/**
 * Rewrites a Cloudinary image URL to inject transformation parameters,
 * enabling automatic format (AVIF/WebP) and quality optimisation with
 * right-sized delivery.
 *
 * Usage:
 *   [src]="url | cloudinary"              -> gallery preset (800px)
 *   [src]="url | cloudinary:'thumb'"      -> 400px fill
 *   [src]="url | cloudinary:'lightbox'"   -> 1200px
 */
@Pipe({ name: 'cloudinary', standalone: true, pure: true })
export class CloudinaryPipe implements PipeTransform {
  transform(url: string | null | undefined, preset: CloudinaryPreset = 'gallery'): string {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com')) return url;

    const transform = TRANSFORMS[preset];
    // Cloudinary URL: .../image/upload/[existing-transforms/]<public_id>
    // We insert our transforms right after /image/upload/
    return url.replace(/\/image\/upload\//, `/image/upload/${transform}/`);
  }
}