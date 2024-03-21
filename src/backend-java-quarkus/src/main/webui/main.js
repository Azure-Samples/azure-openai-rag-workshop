import theaterJS from 'theaterjs';

const theater = theaterJS();

theater
    .on('type:start, erase:start', function() { theater.getCurrentActor().$element.classList.add('actor-content--typing');})
    .on('type:end, erase:end', function() {theater.getCurrentActor().$element.classList.remove('actor-content--typing');});

theater
    .addActor('Quarkus', { speed: 1, accuracy: 0.7 })
    .addActor('Me', { speed: 0.9, accuracy: 0.8 })
    .addScene('Quarkus:Toc toc.', 1000)
    .addScene('Me:What?', 500)
    .addScene('Quarkus:You will eat Quinoa today!', 200)
    .addScene('Me:Nooo...', -3, '!!! ', 150, 'No! ', 150)
    .addScene('Me:Yuk! That\'s impossible!', 100)
    .addScene('Quarkus:It is time!', 100)
    .addScene('Quarkus:With your training and this power,', 100)
    .addScene('Quarkus:You will create awesome web apps.', 100)
    .addScene('Quarkus:It is your destiny!', 200)
    .addScene('Quarkus:Meet Quarkus UI with NO hAssle!', 200)
    .addScene('Me:Neat!', 200)
