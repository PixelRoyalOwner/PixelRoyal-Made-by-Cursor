const React = require('react');

const COLORS = [
    '#FFFFFF', '#820080', '#CF6EE4', '#191973', '#0000EA',
    '#0083C7', '#00D3DD', '#CAE3FF', '#006513', '#688338',
    '#02BE01', '#94E044', '#E5D900', '#FFF889', '#F5DFB0',
    '#E4E4E4', '#C4C4C4', '#888888', '#4E4E4E', '#000000',
    '#F4B3AE', '#FFA7D1', '#FF54B2', '#FF6565', '#E50000',
    '#9A0000', '#FEA460', '#E59500', '#A06A42', '#604028'
];

class ColorPalette extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedColor: '#000000'
        };
    }

    handleColorClick(color) {
        this.setState({ selectedColor: color });
        this.props.onColorSelect(color);
    }

    render() {
        const { selectedColor } = this.state;
        const paletteStyle = {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            maxWidth: '200px',
            zIndex: 1000
        };

        const colorStyle = (color) => ({
            width: '24px',
            height: '24px',
            backgroundColor: color,
            border: color === selectedColor ? '2px solid #000' : '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'transform 0.1s',
            ':hover': {
                transform: 'scale(1.1)'
            }
        });

        return (
            <div style={paletteStyle}>
                {COLORS.map((color, index) => (
                    <div
                        key={index}
                        style={colorStyle(color)}
                        onClick={() => this.handleColorClick(color)}
                        title={color}
                    />
                ))}
            </div>
        );
    }
}

module.exports = ColorPalette; 