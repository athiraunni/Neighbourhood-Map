//*****Model******
//list of locations
var Model = [{
    name: 'Palakkad Fort',
    address: 'Palakkad-Koduvayur-Thathamangalam-Meenakshipuram Highway, Kenathuparambu, Kunathurmedu, Palakkad',
    location: {
        lat: 10.7645789,
        lng: 76.6556474
    },
    pincode: 678001
}, {
    name: 'Malampuzha Dam',
    address: 'Malampuzha-1, Palakkad',
    location: {
        lat: 10.8320321,
        lng: 76.6834272
    },
    pincode: 678651
}, {
    name: 'Silent Valley National Park',
    address: 'Silent Valley Division, Mannarkkad, Karuvara',
    location: {
        lat: 11.0925275,
        lng: 76.4456114
    },
    pincode: 678582
}, {
    name: 'Jainimedu Jain Temple',
    address: 'Shri Chanraprabha Digambara Basti, Chunnambuthara, Vadakkanthara, Palakkad',
    location: {
        lat: 10.7855496,
        lng: 76.6422933
    },
    pincode: 678012
}, {
    name: 'Palakkad RailwayStation',
    address: 'Railway Station Rd, Kallekkulangara, Chepilamury, Olavakode, Palakkad',
    location: {
        lat: 10.799284,
        lng: 76.6375373
    },
    zipcode: 678002
}, {
    name: 'Anangan Mala',
    address: 'Ambalappara Melur Kizhur Rd, Thrikkadeeri -I',
    location: {
        lat: 10.8345682,
        lng: 76.347890
    },
    zipcode: 679501
}];

//creates a new map
var map;

//  function to initialize the map
function initMap() {
    //creating a new map JS object.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 10.527642,
            lng: 76.214435
        },
        zoom: 13,
    });
    //activating knockoutjs by binding viewmodel
    ko.applyBindings(new ViewModel());
}

//alert if map is not loading
function googleError() {
    alert("Google map is not responding. pls Check your connection or come back later.");
}

//create markers array
var markers = [];

//*****View Model******
var ViewModel = function() {
    var self = this;
    //search location in input box
    self.filter = ko.observable('');
    self.locationitems = ko.observableArray(Model);
    self.search = ko.computed(function() {
        //convert into lowercase input entered in the field
        var filter = self.filter().toLowerCase();
        //loop through all places
        self.locationitems().forEach(function(item) {
            if (item.marker) {
                //make marers reappear when input box is cleared
                item.marker.setVisible(true);
            }
        });
        if (!filter) {
            //if there is no searching of locations return all places
            return self.locationitems();
        } else {
            //filtering locations
            return ko.utils.arrayFilter(self.locationitems(), function(item) {
                //searching for locations that we typed
                var place = item.name.toLowerCase().indexOf(filter) !== -1;
                if (item.marker) {
                    //if serached location is found only show the marker of that location
                    item.marker.setVisible(place); // toggle visibility of the marker
                }
                return place;
            });
        }
    }, self);
    //looping over all places
    self.searchplaces = ko.observableArray();
    //looping over locationitems and pushing into seachplaces array
    self.locationitems().forEach(function(place) {
        self.searchplaces.push(place);
    });
    //when clicked on locatin
    self.clickonsearchplaces = function(place) {
        //marker color changed to green
        place.marker.setIcon(makeMarkerIcon('00ff00'));
        //show the marker for that location
        google.maps.event.trigger(place.marker, 'click');
    };

    //intializing infowindow
    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();
    //setting default icon color
    var defaultIcon = makeMarkerIcon('0091ff');
    //setting highlighted icon color
    var highlightedIcon = makeMarkerIcon('FFFF24');
    //looping over model arrays length
    for (i = 0; i < Model.length; i++) {
        //intializing location and name
        var position = Model[i].location;
        var title = Model[i].name;
        //intializing marker
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i

        });
        //adding marker as a property of model
        Model[i].marker = marker;
        //pushing that markers array
        markers.push(marker);
        //when clicked on marker shows an infowindow
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
        //mouse hovers marker and change color
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        //mouse moves away from marker and change color
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
        //map should cover all the locations
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
    //map should be within bounds

    //populate infowindow
    function populateInfoWindow(marker, infowindow) {
        //streetviewservice intialzing
        var streetViewService = new google.maps.StreetViewService();
        //wikipedia api//
        //var articleurl for wkipedia link
        var articleUrl;
        //request for wiki api
        var wikiURL = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
        //timeout for wikipedia page if it takes more than 8 seconds
        var wikiTimeout = setTimeout(function() {
            alert("failed to load wikipedia page");
        }, 8000);
        //ajax requst
        $.ajax({
            url: wikiURL,
            dataType: "jsonp"
            //jsnop datatype
        }).done(function(response) {
            //timeout is cleared if wikipedia link is loaded successfully
            clearTimeout(wikiTimeout);
            //response from wikipedia api
            articleUrl = response[3][0];
            //getpanorama function is invoked
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        });

        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            //set content to marker title
            infowindow.setContent('<div>' + marker.title + '</div>');
            //open infowindow on that marker
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
            //for getting panorama view we are setting radius to 50 if dont get any stretview it should show within 50m
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    //setcontent to location title and wikipedia url
                    infowindow.setContent('<div>' + marker.title + '</div><br><a href ="' + articleUrl + '">' + articleUrl + '</a><hr><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 20
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                } else {
                    //if there is no streetview display title and no streetview
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
                //open infowindow on that marker
                infowindow.open(map, marker);
            }
        }
    }
    // function for changing the colour of marker icon
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    }
};