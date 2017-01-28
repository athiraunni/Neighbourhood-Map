/* Declare a New map */
var map;

/* Initialize the map */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 10.791032,
            lng: 76.6470833
        },
        zoom: 10,
    });
    /* Binding viewmodel & knockout */
    ko.applyBindings(new Viewlocations());
}

/* Error in map loading */
function googleError() {
    alert("Google map is not responding.");
}

/* Declare pointers array */
var pointers = [];

/* Locations_entry */
var locations = [{
    title: 'Silent Valley National Park',
    address: 'Silent Valley Division, Mannarkkad, Karuvara',
    location: {
        lat: 11.0925275,
        lng: 76.4456114
    },
    zipcode: 678582
}, {
    title: 'Palakkad Fort',
    address: 'Palakkad-Koduvayur-Thathamangalam-Meenakshipuram Highway, Kenathuparambu, Kunathurmedu, Palakkad',
    location: {
        lat: 10.7645789,
        lng: 76.6556474
    },
    zipcode: 678001
}, {
    title: 'Malampuzha Dam',
    address: 'Malampuzha-1, Palakkad',
    location: {
        lat: 10.8320321,
        lng: 76.6834272
    },
    zipcode: 678651
}, {
    title: 'Jainimedu Jain temple',
    address: 'Shri Chanraprabha Digambara Basti, Chunnambuthara, Vadakkanthara, Palakkad',
    location: {
        lat: 10.7855,
        lng: 76.6423
    },
    zipcode: 678012
}, {
    title: 'Anangan Mala',
    address: 'Ambalappara Melur Kizhur Rd, Thrikkadeeri -I',
    location: {
        lat: 10.8345682,
        lng: 76.347890
    },
    zipcode: 679501
}];

/* View locations */
var Viewlocations = function() {
    /* To avoid overriding */
    var self = this;
    /* Input in search box & do the search */
    self.filter = ko.observable('');
    self.locationitems = ko.observableArray(locations);
    /* Search function */
    self.search = ko.computed(function() {
        /* Change all to common Lower case */
        var filter = self.filter().toLowerCase();
        /* Loop via all places in the list*/
        self.locationitems().forEach(function(item) {
            /* When input is empty, make pointers visible*/
            if (item.pointer) {
                item.pointer.setVisible(true);
            }
        });
        /* List all locations when there is no search */
        if (!filter) {
            return self.locationitems();
        }
        /* Do search */
        else {
            return ko.utils.arrayFilter(self.locationitems(), function(item) {
                var place = item.title.toLowerCase().indexOf(filter) !== -1;
                /* When search is successful => highlights that pointer alone */
                if (item.pointer) {
                    item.pointer.setVisible(place);
                }
                return place;
            });
        }
    }, self);
    self.searchplaces = ko.observableArray();
    /* Insert found locations to the Array */
    self.locationitems().forEach(function(place) {
        self.searchplaces.push(place);
    });
    /* Change pointer color to blue and show that location on click */
    self.clickonsearchplaces = function(place) {
        place.pointer.setIcon(makeMarkerIcon('0000ff'));
        google.maps.event.trigger(place.pointer, 'click');
    };

    /* Declare Details window */
    var largeDetailwindow = new google.maps.InfoWindow();
    /* Set bounds : latitude & longitude */
    var bounds = new google.maps.LatLngBounds();
    /* Set color to pointers -default & selected */
    var defaultIcon = makeMarkerIcon('ff0000');
    var highlightedIcon = makeMarkerIcon('00ff00');
    /* Loop over the locations Array length */
    for (i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var pointer = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        /* Pointer is included as a model property */
        locations[i].pointer = pointer;
        /* Insert to pointer array */
        pointers.push(pointer);
        /* Show details window on clicking pointer */
        pointer.addListener('click', function() {
            addtoDetailWindow(this, largeDetailwindow);
        });

        /* Set bounds to all locations in list */
        bounds.extend(pointers[i].position);
    }
    /* Fit map within the bounds */
    map.fitBounds(bounds);

    /* Add details to details window */
    function addtoDetailWindow(pointer, detailwindow) {
        //intialzing streetviewservice
        var streetViewService = new google.maps.StreetViewService();
        //wikipedia api//
        //var articleurl for wkipedia link
        var articleUrl;
        //request for wiki api
        var wikiURL = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + pointer.title + '&format=json&callback=wikiCallback';
        //wikipedia timeout if it takes more than 8 seconds
        var wikiTimeout = setTimeout(function() {
            alert("failed to load wikipedia page");
        }, 10000);
        //ajax request
        $.ajax({
            url: wikiURL,
            dataType: "jsonp"
            //jsnop datatype
        }).done(function(response) {
            //timeout is cleared if wikipedia link is loaded successfully
            clearTimeout(wikiTimeout);
            //response from wikipedia api
            articleUrl = response[3][0];
            //getPanorama function is invoked
            streetViewService.getPanoramaByLocation(pointer.position, radius, getStreetView);
        });

        if (detailwindow.pointer != pointer) {
            detailwindow.pointer = pointer;
            //set content to pointer title
            detailwindow.setContent('<div>' + pointer.title + '</div>');
            //open detailwindow on that pointer
            detailwindow.open(map, pointer);
            // Make sure the pointer property is cleared if the detailwindow is closed.
            detailwindow.addListener('closeclick', function() {
                detailwindow.pointer = null;
            });
            //for getting wideview view we are setting radius to 50 if dont get any stretview it should show within 50m
            var radius = 50;
            // In case the status is OK, which means the wideview was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // wideview from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, pointer.position);
                    //setcontent to location title and wikipedia url
                    detailwindow.setContent('<div>' + pointer.title + '</div><br><a href ="' + articleUrl + '">' + articleUrl + '</a><hr><div id="detail"></div>');
                    var wideviewOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 20
                        }
                    };
                    var wideview = new google.maps.StreetViewPanorama(
                        document.getElementById('detail'), wideviewOptions);
                } else {
                    // streetview unavailable
                    detailwindow.setContent('<div>' + pointer.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
                //open detailwindow on that pointer
                detailwindow.open(map, pointer);
            }
        }
    }
    // Changing colour of pointer icon
    function makeMarkerIcon(pointerColor) {
        var pointerImage = new google.maps.MarkerImage(
            'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + pointerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return pointerImage;
    }
};
