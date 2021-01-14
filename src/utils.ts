export function dateToMJD(d: Date) {
    // convert a Gregorian Date to a Julian number.
    //    S.Boisseau / BubblingApp.com / 2014
    const x = Math.floor((14 - d.getMonth()) / 12);
    const y = d.getFullYear() + 4800 - x;
    const z = d.getMonth() - 3 + 12 * x;

    const n = d.getDate() + Math.floor(((153 * z) + 2) / 5) + (365 * y) + Math.floor(y / 4) + Math.floor(y / 400) - Math.floor(y / 100) - 32045;

    return n - 2400000.5;
}
