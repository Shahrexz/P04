import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import io from 'socket.io-client';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from "expo-constants";

const API_BASE_URL: string = Constants.expoConfig?.extra?.API_BASE_URL || "";

interface Room {
    _id: string;
    room_type: string;
    room_number: number;
    hotel_id: string;
    rent: number;
    available: boolean;
    bed_size: string;
}

interface RoomDetails {
    roomID: string;
    room_type: string;
    room_number: number;
    rent: number;
    available: boolean;
    bed_size: string;
    hotelID: string;
}

let socket: any;
export default function ReservationScreen() {
    const { placeID } = useLocalSearchParams<{ placeID: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [reservationDetails, setReservationDetails] = useState({
        name: '',
        email: '',
        CNIC: '',
        phone: '',
        roomID: '',
        placeID: '',
        fromDate: '' as string | null,
        toDate: '' as string | null,
        paymentMethod: 'OTHERS', // Default value
    });

    // Add state for showing the date pickers
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        socket = io(`${API_BASE_URL}` /*'https://d1lxguzc6q41zr.cloudfront.net'*/);
        socket.on('connect', () => console.log('Connected to server'));

        socket.on("room_reserved", (data: { room: RoomDetails }) => {
            console.log("Room Reserved Update:", data);

            setRooms((prevRooms) => {
                const updatedRooms = [...prevRooms];

                // Check if room already exists, if yes, update availability
                const roomIndex = updatedRooms.findIndex(room => room._id === data.room.roomID);

                if (roomIndex !== -1) {
                    updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], available: data.room.available };
                } else {
                    updatedRooms.push({
                        _id: data.room.roomID,
                        room_type: data.room.room_type,
                        room_number: data.room.room_number,
                        hotel_id: data.room.hotelID,
                        rent: data.room.rent,
                        available: data.room.available,
                        bed_size: data.room.bed_size,
                    });
                }

                return updatedRooms;
            });
        });

        socket.on('disconnect', () => console.log('Disconnected from server'));

        const fetchRooms = async () => {
            console.log("Fetching rooms for placeID:", placeID);
            try { 
                const response = await axios.get(`${API_BASE_URL}/getRooms/${placeID}`/*`https://d1lxguzc6q41zr.cloudfront.net/getRooms/${placeID}`*/);
                setRooms(response.data);
            } catch (err) {
                setError('Failed to fetch rooms. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
        socket.on('room_updated', (updatedRoom: Room) => {
            console.log('Room updated:', updatedRoom);

            setRooms((prevRooms) =>
                prevRooms.map((room) => (room._id === updatedRoom._id ? updatedRoom : room))
            );
        });
        return () => socket.disconnect();
    }, [placeID]);

    const handleExpandRoom = (roomID: string) => {
        setExpandedRoom(expandedRoom === roomID ? null : roomID);
    };

    const handleMakeReservation = (roomID: string, placeID: string) => {
        setModalVisible(true);
        setReservationDetails((prevDetails) => ({ ...prevDetails, roomID, placeID }));
    };

    const handleSubmitReservation = async () => {
        if (!reservationDetails.name || !reservationDetails.email || !reservationDetails.phone || !reservationDetails.fromDate || !reservationDetails.toDate) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }

        const reservationStatus = reservationDetails.paymentMethod === 'ONLINE' ? 'CONFIRMED' : 'PENDING';

        try {
            const response = await axios.post(`${API_BASE_URL}/api/reservations`/*'https://d1lxguzc6q41zr.cloudfront.net/api/reservations'*/, {
                ...reservationDetails,
                roomID: reservationDetails.roomID,
                placeID: reservationDetails.placeID,
                reservationStatus,
            });

            socket.emit('reservation-updated', { placeID, reservationDetails });

            Alert.alert('Success', response.data.message);
            setModalVisible(false);
            setReservationDetails({ name: '', email: '', CNIC: '', phone: '', roomID: '', placeID: '', fromDate: null, toDate: null, paymentMethod: 'OTHERS' });
        } catch (error) {
            Alert.alert('Error', 'Failed to create reservation.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading rooms...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Select a Room</Text>
            {rooms.length > 0 ? (
                rooms.map((room) => (
                    <View key={room._id} style={[styles.roomBox, !room.available && styles.unavailableRoom]}>
                        <TouchableOpacity onPress={() => handleExpandRoom(room._id)} style={styles.roomHeader}>
                            <Text style={styles.roomNumber}>Room {room.room_number}</Text>
                            <Text style={styles.roomNumber}>Room Type: {room.room_type}</Text>
                        </TouchableOpacity>

                        {expandedRoom === room._id && (
                            <View style={styles.roomDetails}>
                                <Text style={styles.text}>Bed Size: {room.bed_size}</Text>
                                <Text style={styles.text}>Rent: {room.rent} Pkr</Text>
                                <Text style={[styles.text, { color: room.available ? 'green' : 'red' }]}>
                                    {room.available ? 'Available' : 'Not Available'}
                                </Text>

                                {room.available && (
                                    <TouchableOpacity style={styles.reserveButton} onPress={() => handleMakeReservation(room._id, room.hotel_id)}>
                                        <Text style={styles.buttonText}>Make Reservation</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.noRoomsText}>No rooms available in this hotel.</Text>
            )}

            {/* Reservation Form Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Enter Reservation Details</Text>
                        <TextInput style={styles.modalInput} placeholder="Your Name" value={reservationDetails.name} onChangeText={(text) => setReservationDetails({ ...reservationDetails, name: text })} />
                        <TextInput style={styles.modalInput} placeholder="Your Email" value={reservationDetails.email} onChangeText={(text) => setReservationDetails({ ...reservationDetails, email: text })} />
                        <TextInput style={styles.modalInput} placeholder="Your CNIC" value={reservationDetails.CNIC} onChangeText={(text) => setReservationDetails({ ...reservationDetails, CNIC: text })} />
                        <TextInput style={styles.modalInput} placeholder="Your Phone Number" value={reservationDetails.phone} onChangeText={(text) => setReservationDetails({ ...reservationDetails, phone: text })} />

                        <Text style={styles.dateText}>From Date:</Text>
                        <TouchableOpacity onPress={() => setShowFromPicker(true)}>
                            <Text style={styles.modalInput}>
                                {reservationDetails.fromDate ? reservationDetails.fromDate : 'Select Date'}
                            </Text>
                        </TouchableOpacity>
                        {showFromPicker && (
                            <DateTimePicker
                                value={reservationDetails.fromDate ? new Date(reservationDetails.fromDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowFromPicker(false);
                                    if (selectedDate) {
                                        setReservationDetails({ ...reservationDetails, fromDate: moment(selectedDate).format('YYYY-MM-DD') });
                                    }
                                }}
                            />
                        )}

                        <Text style={styles.dateText}>To Date:</Text>
                        <TouchableOpacity onPress={() => setShowToPicker(true)}>
                            <Text style={styles.modalInput}>
                                {reservationDetails.toDate ? reservationDetails.toDate : 'Select Date'}
                            </Text>
                        </TouchableOpacity>
                        {showToPicker && (
                            <DateTimePicker
                                value={reservationDetails.toDate ? new Date(reservationDetails.toDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowToPicker(false);
                                    if (selectedDate) {
                                        setReservationDetails({ ...reservationDetails, toDate: moment(selectedDate).format('YYYY-MM-DD') });
                                    }
                                }}
                            />
                        )}

                        {/* Payment Method Picker */}
                        <Text style={styles.dateText}>Payment Method:</Text>
                        <Picker selectedValue={reservationDetails.paymentMethod} onValueChange={(itemValue) => setReservationDetails({ ...reservationDetails, paymentMethod: itemValue })}>
                            <Picker.Item label="Online" value="ONLINE" />
                            <Picker.Item label="Others" value="OTHERS" />
                        </Picker>

                        <Button title="Submit Reservation" onPress={handleSubmitReservation} />
                        <Button title="Cancel" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15, alignItems: 'center' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    roomBox: { width: '90%', backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, borderWidth: 1, borderColor: '#ddd' },
    unavailableRoom: { backgroundColor: '#ffcccc', borderColor: 'red' },
    roomHeader: { alignItems: 'center' },
    roomNumber: { fontSize: 18, fontWeight: 'bold' },
    roomDetails: { marginTop: 10, alignItems: 'center' },
    text: { fontSize: 16, marginBottom: 5 },
    reserveButton: { marginTop: 10, backgroundColor: '#007bff', padding: 10, borderRadius: 5 },
    buttonText: { color: 'white', fontSize: 16 },
    errorText: { fontSize: 16, color: 'red' },
    loadingText: { fontSize: 16, marginTop: 10 },
    noRoomsText: { fontSize: 16, color: '#555' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 },
    dateText: { fontSize: 16, color: '#007bff', marginBottom: 10 },
});
