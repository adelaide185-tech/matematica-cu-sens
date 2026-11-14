/** Generator pseudo-aleator reproductibil (mulberry32). Același seed → aceeași fișă. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** întreg în [min, max] inclusiv */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  bool(p = 0.5): boolean {
    return this.next() < p;
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** k valori distincte produse de f */
  distinct<T>(k: number, f: () => T, key: (x: T) => string = String): T[] {
    const out: T[] = [];
    const seen = new Set<string>();
    for (let guard = 0; out.length < k && guard < k * 200; guard++) {
      const x = f();
      const kx = key(x);
      if (!seen.has(kx)) {
        seen.add(kx);
        out.push(x);
      }
    }
    return out;
  }
  /** seed derivat, pentru sub-generatoare independente */
  fork(salt: number): Rng {
    return new Rng((Math.floor(this.next() * 2 ** 31) ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);
  }
}

export function seedNou(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
