import { describe, it, expect } from 'vitest';
import { CloudinaryPipe } from './cloudinary.pipe';

describe('CloudinaryPipe', () => {
  const pipe = new CloudinaryPipe();
  const sampleUrl = 'https://res.cloudinary.com/demo/image/upload/v1700000000/jomla/sample.jpg';

  it('returns empty string for null, undefined, or empty string', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('passes non-Cloudinary URLs through unchanged', () => {
    const external = 'https://cdn.example.com/images/product.png';
    expect(pipe.transform(external)).toBe(external);
    expect(pipe.transform('/icons/offer-placeholder.svg', 'thumb')).toBe('/icons/offer-placeholder.svg');
  });

  it('injects default gallery transformation parameters', () => {
    expect(pipe.transform(sampleUrl)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1700000000/jomla/sample.jpg'
    );
  });

  it('supports thumb, lightbox, lightbox-thumb, and avatar presets', () => {
    expect(pipe.transform(sampleUrl, 'thumb')).toContain('/image/upload/f_auto,q_auto,w_400,c_fill,g_auto/');
    expect(pipe.transform(sampleUrl, 'lightbox')).toContain('/image/upload/f_auto,q_auto,w_1200/');
    expect(pipe.transform(sampleUrl, 'lightbox-thumb')).toContain('/image/upload/f_auto,q_auto,w_120,c_fill,g_auto/');
    expect(pipe.transform(sampleUrl, 'avatar')).toContain('/image/upload/f_auto,q_auto,w_128,h_128,c_fill,g_face/');
  });

  it('does not double-transform a URL that already includes f_auto transforms', () => {
    const transformed = pipe.transform(sampleUrl, 'avatar');
    expect(pipe.transform(transformed, 'thumb')).toBe(transformed);
  });
});
