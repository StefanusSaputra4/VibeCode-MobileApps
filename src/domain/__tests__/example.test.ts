describe('Inisialisasi Lingkungan Uji (T1)', () => {
  it('harus memastikan Jest dan TypeScript berjalan dengan baik', () => {
    const tambah = (a: number, b: number): number => a + b;
    expect(tambah(1, 9)).toBe(10);

  });
});
