// This is my ProductDetailsScreen.jsx file
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const ProductDetailsScreen = ({ product, onBack, onAddToCart, onBuyNow }) => {
    const [selectedSize, setSelectedSize] = useState(null);

    if (!product) return null;

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        onAddToCart(product, selectedSize);
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        onAddToCart(product, selectedSize);
        onBuyNow?.();
    };

        // Use availableSizes from product if provided, otherwise default
        const displaySizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0
            ? product.availableSizes
            : DEFAULT_SIZES;

        return (
        <View style={styles.container}>
            <View style={styles.backArrow}>
                <TouchableOpacity style={styles.header} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.productImage}>
                <Image source={{ uri: product.image }} style={styles.image} />
            </View>

            <View style={styles.productDetailsCard}>
                <Text style={styles.title}>{product.title}</Text>
                <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            </View>

            <View style={styles.sizeContainer}>
                <Text style={styles.sizeText}>Size</Text>
                <View style={styles.sizesContainer}>
                    {displaySizes.map(size => (
                        <TouchableOpacity
                            key={size}
                            style={[styles.sizeCircle, selectedSize === size && styles.sizeCircleActive]}
                            onPress={() => setSelectedSize(size)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 16, color: selectedSize === size ? '#fff' : '#444', fontWeight: selectedSize === size ? 'bold' : '600' }}>{size}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.addCartContainer}>
                <TouchableOpacity style={styles.addCartButton} onPress={handleAddToCart} activeOpacity={0.85}>
                    <Text style={styles.addCartText}>Add To Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff3f8',
        padding: 24,
    },
    header: {
        width: 44,
        height: 44,
        marginBottom: 16,
        backgroundColor: '#E96E6E',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        shadowColor: '#ffb6d5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    backArrow: {
        marginTop: 20,
        marginLeft: 10,
    },
    productImage: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    image: {
        width: '100%',
        height: 425,
        borderRadius: 20,
        marginBottom: 5,
    },
    productDetailsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 10,
        marginVertical: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: '#444444',
        marginHorizontal: 10,
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4c4c4c',
    },
    sizeText: {
        marginHorizontal: 20,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444444',
    },
    sizesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        marginHorizontal: 20,
    },
    sizeCircle: {
        width: 30,
        height: 30,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
        backgroundColor: '#fff',
    },
    sizeCircleActive: {
        backgroundColor: '#E96E6E',
        borderColor: '#E96E6E',
    },
    colorsContainer: {
        marginHorizontal: 20,
        marginVertical: 10,
    },
    colorText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444444',
        marginBottom: 10,
    },
    colorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    colorCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginHorizontal: 6,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    colorCircleActive: {
        borderColor: '#E96E6E',
        borderWidth: 2.5,
    },
    addCartContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    addCartButton: {
        backgroundColor: '#E96E6E',
        borderRadius: 24,
        paddingVertical: 14,
        paddingHorizontal: 48,
        shadowColor: '#ffb6d5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    addCartText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    buyNowContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    buyNowButton: {
        backgroundColor: '#444',
        borderRadius: 24,
        paddingVertical: 14,
        paddingHorizontal: 48,
        elevation: 3,
    },
    buyNowText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
