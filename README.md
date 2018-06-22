# react-titles
React-titles is a collection of title animations made is SVG, React-motion and GSAP.

With React Titles you can bring your web articles to life. When the component mounts to DOM it starts an animation, and the animation reverses back when it unmounts. The texts props passed to Title components are auto-sized to fit the specified box size. A title component automatically removes itself from DOM when it was closed.

# Usage
```js
import React, {Component} from "react";
import Title from "react-titles/Title2";

class ReactTitle extends Component {
    render() {
        return (
            <Title size="400" text1="I LOVE" text2="REACT" open={true} />
        );
    }
};
```

## Closing Title Components:
To see the animation reverses when closing a Title component, you should pass the state to the _open_ prop rather than wrapping the entire component within a condition. The Title component will remove itself when the animation completes.

### Wrong:
```js
    <div className="container">
        {   this.state.isOpen &&
            <Title size="400" text1="SOME" text2="TITLE" />
        }
    </div>
```
### Correct:
```js
    <Title size="400" text1="SOME" text2="TITLE" open={this.state.isOpen} />
```

# Instalation
``npm install react-titles`` or ``yarn add react-titles``

# Component API
| Name          | Type          | Default      | Description                                          |
| ------------- |:-------------:|:------------:|:----------------------------------------------------:|
| size          | string        | 400          | The explosion size                                   |
| text1         | string        | empty string | The main title                                       |
| text2         | string        | empty string | The subtitle (Note: Title 1 and 7 have only one text)|
| open          | boolean       | true         | Show or hide the componenet                          |
| fontFamily    | string        | empty string | The font-family applied to texts                     |
| onComplete    | func          | function     | Fires when animation completes                       |

# License
``react-titles`` is under the MIT license.