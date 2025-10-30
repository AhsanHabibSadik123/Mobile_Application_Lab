import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
const ProductCard = ({ product, onPress, isFavorite, onToggleFavorite }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
            <Image source={{ uri: product.image }} style={styles.coverImage} />
            <View style={styles.textContainer}>
                <Text style={styles.productName}>{product.title}</Text>
                <Text style={styles.productPrice}>${(product.price || 0).toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={onToggleFavorite} style={styles.heartContainer}>
                {
                    isFavorite ? (
                        <AntDesign name="heart" size={24} color="#eb4f4f" />
                    ) : (
                        <AntDesign name="hearto" size={24} color="#444444" />
                    )
                }
            </TouchableOpacity>
        </TouchableOpacity>
    )
}

export default ProductCard

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 20,
    },
    coverImage: {
        marginTop: 10,
        height: 250,
        width: '88%',
        borderRadius: 20,
        marginVertical: 10,
        alignSelf: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: 600,
        color: '#444444',
        marginLeft: 10,
        marginTop: 5,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 600,
        color: '#9c9c9c',
        marginLeft: 10,
        marginTop: 5,
    },
    textContainer: {
        paddingLeft: 15,
    },
    heartContainer: {
        height: 34,
        width: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 17,
        position: 'absolute',
        top: 20,
        right: 20,
    },
})