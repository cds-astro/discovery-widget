export class Viewport {
    public tl: number[] = [];
    public tr: number[] = [];
    public bl: number[] = [];
    public br: number[] = [];

    public center: number[] = [];

    public constructor(center: number[]= [0, 0], tl?: number[], tr?: number[], bl?: number[], br?: number[]) {
        this.tl = tl ? tl : [0, 0];
        this.tr = tr ? tr : [0, 0];
        this.bl = bl ? bl : [0, 0];
        this.br = br ? br : [0, 0];
        this.center = center;
    }

    public setCenter(center: number[]) {
        this.center = center;
    }

    public toString(): string {
        if (this.isPolygon()) {
            const bounds = [this.tl, this.tr, this.br, this.bl];
            return 'stc=Polygon ' + bounds.toString().split(',').join(' ');
        }
        return 'RA=' + this.center[0] + '&DEC=' + this.center[1] + '&SR=90';
    }

    public getCenter(): number[] {
        return this.center;
    }

    public getRadius(): number {
        // Depending on the shape of the viewport:
        // 1. If it is a cone, we return the radius
        // 2. If it is a polygon (i.e. a rectangle), we return the half of the diagonal of the rectangle.
        if (this.isPolygon()) {
            return Math.sqrt(
                Math.pow(this.center[0] - this.tl[0], 2) +
                Math.pow(this.center[1] - this.tl[1], 2),
            );
        }
        return 90.0;
    }

    private isPolygon(): boolean {
        const bounds = [this.tl, this.tr, this.br, this.bl];
        // Two cases :
        // 1. The window has its corners in the view sphere
        // 2. The corners of the window are out of bounds and therefore
        //    we retrieve the collections having observations in the cone
        //    of radius 90 deg and centered on the aladin lite focus point.
        const cone = bounds.every((elem: number[]) => {
            return elem[0] === 0 && elem[1] === 0;
        });

        return !cone;
    }
}
