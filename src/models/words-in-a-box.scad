inputText = "Live Laugh Love";
textHeight = 2.00;
textThickness = 0.30;

wallThickness = 0.20;
wallHeight = textThickness * 2.05;
floorThickness = wallheight - textThickness;
radius = len(inputText);

union() {
    difference() {
        color("orange")
        
        // Exterior
        linear_extrude(height=wallHeight) {
            regular_polygon(order=4, r=radius);
        }
        // Interior
        translate([0, 0, floorThickness]) {
            linear_extrude(height=wallHeight*1.1) {
                regular_polygon(order=4, r=radius - wallThickness);
            }
        }
    }

    linear_extrude(textThickness)
        text( inputText,
            font = "Arial:style=Bold",
            halign = "center",
            valign = "center",
            size = textHeight * 1.05
        );


}


/** Includes */
module regular_polygon(order = 4, r=1){
     angles=[ for (i = [0:order-1]) i*(360/order) ];
     coords=[ for (th=angles) [r*cos(th), r*sin(th)] ];
     polygon(coords);
 }
