function createPalette() {
    let selection = document.getElementById("selection");
    selection.innerHTML = "";
    
    for (var i = 0; i < Palette.length; i++) {
        var colorOption = document.createElement("div");
        
        colorOption.setAttribute("data-index", i);
        colorOption.classList.add("colors");
        colorOption.style.backgroundColor = Palette[i];
        
        if (i == colorIndex) {
            colorOption.setAttribute("data-state", "selected");
        } else {
            colorOption.setAttribute("data-state", "unselected");
        }
        // https://stackoverflow.com/questions/19655189/javascript-click-event-listener-on-class
        
        colorOption.addEventListener('click', changeColorSelection, false);
        selection.appendChild(colorOption);
    }
}

// https://stackoverflow.com/questions/21211906/get-value-from-element-in-the-clicked-class
function changeColorSelection(){
    colorIndex = this.getAttribute("data-index");
    var elements = document.getElementsByClassName("colors");
    for (var i = 0; i < elements.length; i++) {
        if (i == colorIndex) {
            elements[i].setAttribute("data-state","selected");
        } else {
            elements[i].setAttribute("data-state","unselected");
        }
    }
};