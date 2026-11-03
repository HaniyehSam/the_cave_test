// The story of Little Margin.
//
// Mr Quill drew the whole town, brick by brick. One night he got on the last train halfway
// through a lamppost and never came back, so half of Little Margin is still dotted lines.
// You arrive on the midnight train and everybody takes you for the new artist. They all have
// a little favour to ask. Whatever you finish comes alive, not always quite as planned, and
// once enough of the town is drawn, Little Margin holds a parade of your drawings.
//
// Everything a resident says lives here, by "zone:resident". Each gets
// { has, word, parade, drawn }: has(id) is true once that secret or idea in their zone is done,
// drawn is how many things you have finished across town, parade is true once it has begun.
// No DOM in here: the tests read it too.

export const PARADE_AT = 12;   // things finished around town before the parade starts

const either = (done, after, before) => (done ? after : before);

export const LINES = {
  'station:heron': ({ has, parade, drawn }) => parade ? [
    'A postcard came for you. From Mr Quill. All it says is: “Saw the parade from the train. It’s your town now.”',
    'I have told the midnight train it can stay. It never went anywhere anyway.',
  ] : [
    ...(drawn ? [] : [
      'Off the midnight train at last! You will be the new artist. We have been expecting you for six years.',
      'Mr Quill drew every brick of Little Margin. Then one night he got on the last train, halfway through a lamppost, and never came back.',
      'Half the town is still dotted lines. People walk into things that are not finished. Head for Paper Street, past the harbour. Mrs Ondine will put the kettle on.',
    ]),
    either(has('carriage'), 'That carriage you drew keeps leaving without the train. Very keen. I respect that.',
      'While you are here: the midnight train is one carriage short. Mr Quill only got as far as the dots.'),
    either(has('waiting'), 'Look at that, somebody waiting on my platform. First time since the war. Which war, I could not tell you.',
      'Nobody ever waits on this platform. If you drew someone waiting, it would look ever so busy.'),
    either(has('clock'), 'The clock is going again. We are only forty minutes late, which is a record.', 'The clock stopped the night Mr Quill left. The hands are still waiting for him to finish them.'),
    ...(drawn >= PARADE_AT / 2 ? ['People are talking about you, you know. Mostly nice things. Mostly.'] : []),
  ],
  'station:bea': () => ['(Bea is fast asleep.)', 'Mmf… is it Moonside yet?', '(Bea dreams of a train with your drawings on it.)'],

  'home:ondine': ({ has, parade }) => parade ? [
    'A parade! In Little Margin! I have put my good hat on. It is my only hat, but still.',
    'Mr Quill always said the town would finish itself one day. He meant you, dear.',
  ] : [
    either(has('kite'), 'Look at that kite go! It took my washing with it, but look at it go.',
      'Oh! The new artist! I knew someone would come. I have been knitting you a welcome scarf since 2019.'),
    ...(has('kite') ? [] : ['Mr Quill started a kite for the street, up by the tree. Just the dots, poor thing. Would you finish it?']),
    'If you want a colour mixed, my dish is in the kitchen. Two paints in, one colour out. Like baking, with less cake.',
    'Where Mr Quill never got round to drawing a house, he pasted up a photograph of one. Very convincing, from a distance.',
    either(has('record'), 'My old record! I have not danced since 1974. I am not about to start now, but it is nice to have the option.',
      'That record player has not turned since Mr Quill left. It only needs a little scribble to get it going.'),
  ],
  'home:theo': ({ has, parade }) => parade ? ['The parade went right past the window. Free coffee for anyone dressed as a drawing.'] : [
    either(has('car'), 'It goes! It does not stop, mind. It has done eleven laps of the street. I will get a bike.',
      'You are the new artist? Brilliant. Mr Quill drew half my car and then left. I have been pushing it for six years.'),
    either(has('sky'), 'Whatever you drew in the sky keeps looking in the window. I have given it a biscuit.',
      'Something ought to fly over this street. A bird, a dragon, a sofa. Your call.'),
    'Half the cars round here are photographs. They do not stop for anybody. They cannot see you.',
    either(has('awning'), 'The awning! It looks like a birthday. On the house, the coffee is imaginary.', 'The awning was never finished. Customers get rained on. They say they like it. They are lying.'),
  ],

  'market:pepper': ({ has, parade }) => parade ? ['Best parade I have ever seen. Only parade I have ever seen. Still the best.'] : [
    either(has('fireworks'), 'Lovely fireworks. Very quiet ones. The cats approve.',
      'The night market used to have fireworks. Mr Quill drew the bang but never the sparkle. Up over the stalls, if you would.'),
    either(has('balloon'), 'Somebody took that balloon of yours for a ride. They have not come down. They wave sometimes.',
      'That balloon has been half drawn since spring. Nobody dares get in.'),
    'Careful with that crate. Something in there wriggles.',
  ],
  'market:mei': ({ has }) => [
    either(has('lanterns'), 'The lanterns are lit! Now people can find us from the bridge.', 'Noodles are on. The big lantern in the middle never got finished. Give it a scribble?'),
    'Have a bowl. The steam is the best part.',
  ],
  'market:lune': ({ has }) => [
    either(has('crystal'), 'The ball shows me blue. Take it. It was always yours.', 'I see… a pencil in your future. Draw on the ball, child. It shows me nothing blank.'),
    'I foresee a parade. I am never wrong, apart from the times I am wrong.',
  ],

  'greenhouse:slow': ({ has, parade }) => parade ? ['I saw the parade. Well, the start of it. It will be past by now.'] : [
    either(has('butterfly'), 'The butterfly is off. Took three days to say goodbye. Lovely manners.',
      'There is a butterfly in here Mr Quill never finished. It has been very patient. I can relate.'),
    either(has('glass'), 'So that is what was growing behind the glass. I had a feeling.', 'Something has been growing behind that pane of glass for years. Nobody has looked.'),
    either(has('sky'), 'Your bird keeps tapping on the roof. I have let it in twice.', 'Birds look in through the roof, but none of them are finished enough to come in.'),
  ],
  'greenhouse:gloria': ({ has }) => has('pond')
    ? ['The fish are back! Lovely. Slightly nippy.', 'Ribbit. That means thank you.']
    : ['Ribbit. That is “hello” in frog.', 'The pond was never finished. Scribble in the water, would you? I would like to swim.'],
  'greenhouse:sunflower': () => ['I am facing the wrong way. Mr Quill drew the sun on the other side.', 'I was going to be yellow. Then he left.'],

  'cabinet:hoot': ({ has, parade }) => parade ? ['I have catalogued the parade. Every drawing, under P. It took all night.'] : [
    either(has('escaped'), 'Ah, so THAT is what escaped. Filed under “oh dear”.',
      'Something escaped from the cabinet the night Mr Quill left. Nobody saw what. Draw it, so I can file it.'),
    either(has('label'), 'You scribbled on the label. It said not to. Very good. Rules are for cabinets.', 'That little frame on the wall says “do not scribble”. I have never been sure.'),
    either(has('prism'), 'A rainbow, filed under R. Take it with you; it is a paint now.', 'The prism in the bell jar has not had anything to split in years.'),
    'Everything in here is real, you know. Every single thing.',
  ],

  'harbour:brine': ({ has, parade }) => parade ? ['Watched the parade from the boat. Caught nothing. Best day of my life.'] : [
    either(has('catch'), 'Look at that! The biggest one I never caught.',
      'Forty years I have fished here and never caught a thing. Mr Quill never drew the fish. Draw what I have caught?'),
    either(has('gull'), 'Your gull stole my sandwich. A proper gull. Well done.', 'That gull over there is only dots. It cannot even steal a chip.'),
    either(has('lamp'), 'Now that is a light. Boats will find their way home again.', 'The lighthouse lamp was the last thing Mr Quill meant to draw. It is still dark up top.'),
  ],

  'observatory:orbit': ({ has, parade }) => parade ? ['I watched the parade through the telescope. Upside down, but magnificent.'] : [
    either(has('planet'), 'A new planet! I have named it after you. Well, after your pencil.',
      'There is a planet up there nobody has found yet. Mostly because nobody has drawn it.'),
    either(has('rocket'), 'Your rocket keeps nearly taking off. It is building up the courage.', 'Mr Quill started a rocket. Got as far as the dots and lost his nerve.'),
    either(has('lens'), 'Meteors! Dozens! Write that down. No, wait, I will.', 'The lens of the big telescope is blank. Scribble on it and we might see something.'),
  ],

  'rooftops:ray': ({ has, parade }) => parade ? ['Best seat in town for the parade, this. Mind the chimney.'] : [
    either(has('view'), 'That is the view now? Better than the real one.', 'Best view in Little Margin, up here. Or it would be, if anyone had drawn it.'),
    either(has('kite'), 'Look at it go! I have been trying to get that kite down for a year.', 'Some kid’s kite is stuck on the aerial. A scribble might shake it loose.'),
    either(has('bird'), 'The bird on the water tower sings now. Badly, but it sings.', 'There is a bird on the water tower made entirely of dots. It looks embarrassed.'),
  ],

  'orchard:bramble': ({ has, parade }) => parade ? ['We threw fruit at the parade. Nicely. It was a fruit parade by the end.'] : [
    either(has('fruit'), 'I tasted it. I cannot describe it. Mostly crunchy.', 'One branch has never fruited. I reckon it is waiting for a fruit nobody has ever tasted.'),
    either(has('sapling'), 'A new tree! It is already arguing with the old ones.', 'Mr Quill promised a new tree. There is the outline, by the edge. Mind you do not fall off.'),
    either(has('blossom'), 'Blossom in the clouds! The bees are beside themselves.', 'The cherry tree has been asleep for ages. A little scribble in its branches might wake it.'),
  ],
  'orchard:nimbus': () => ['Baa. (It sounds like distant thunder.)', '(Nimbus is slightly damp.)'],
  'orchard:turkey': () => ['Gobble. I have no idea how I got up here either.', 'I was painted in 1820-something. Very flattering.'],

  'cellar:delve': ({ has, parade }) => parade ? ['I heard the parade through the ceiling. The roots were dancing.'] : [
    either(has('barrels'), 'So that is what lives behind the barrels. It is smaller than it sounded.',
      'Something lives behind the barrels. Mr Quill said he would draw it “tomorrow”. That was 1987.'),
    either(has('bat'), 'Your bat hangs about. As bats do.', 'There is half a bat on the ceiling. It cannot decide which way up to be.'),
    either(has('mushrooms'), 'The mushrooms glow again! I can put my lantern down for once.', 'Those little mushrooms used to glow. A scribble might wake them.'),
  ],

  'library:worm': ({ has, parade }) => parade ? ['Shh. Even about the parade. But well done.'] : [
    either(has('book'), 'A cover! Now somebody will have to write the book. Not me. I am a worm.',
      'Every book in here is finished except one. The cover is blank. Mr Quill said it was “for whoever comes next”.'),
    either(has('candle'), 'Light! Now I can finally finish chapter four hundred.', 'Shh. The candle went out the night Mr Quill left. Nobody can read a thing.'),
    'You came down the manhole? Everybody does, eventually.',
  ],

  'seafloor:oona': ({ has, parade }) => parade ? ['I heard there was a parade up top. I had my own down here. Eight arms, lots of waving.'] : [
    either(has('creature'), 'A new creature! It has already eaten my sandwich. We are friends.',
      'There is a creature down here nobody has discovered, because nobody has drawn it yet.'),
    either(has('fish'), 'Your fish swims backwards when nobody is looking. Very rude. I love it.', 'That fish is only dots. The others will not play with it.'),
    either(has('clam'), 'The clam opened for you! It never opens for me.', 'That clam has been sulking for years. A scribble might cheer it up.'),
  ],
  'seafloor:diver': () => ['Blub. (He waves.)', 'Blub blub. (He points at the jellyfish, very impressed.)'],
};
