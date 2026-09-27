"""
MetriSure — Database Models: Instrument & InstrumentModel
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class InstrumentModel(Base, TimestampMixin):
    """Defines a model/type of weighing instrument."""
    __tablename__ = "instrument_models"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer_name = Column(String(255), nullable=False)
    manufacturer_address = Column(String(500))
    model_name = Column(String(255), nullable=False)
    model_identifier = Column(String(100), unique=True, nullable=False)
    
    # Metrological parameters
    accuracy_class = Column(String(10), nullable=False)  # I, II, III, IIII
    max_capacity = Column(Float, nullable=False)
    max_capacity_unit = Column(String(10), default="kg")
    min_capacity = Column(Float, nullable=False)
    min_capacity_unit = Column(String(10), default="kg")
    verification_interval_e = Column(Float, nullable=False)  # e value
    verification_interval_e_unit = Column(String(10), default="kg")
    actual_interval_d = Column(Float, nullable=False)  # d value
    actual_interval_d_unit = Column(String(10), default="kg")
    num_intervals_n = Column(Integer)  # n = Max/e
    
    # Technical parameters
    weighing_mode = Column(String(50), default="single_interval")  # single_interval, multi_interval, multiple_range
    tare_type = Column(String(50), default="subtractive")
    max_tare = Column(Float)
    num_supports = Column(Integer, default=4)
    platform_size = Column(String(100))
    power_supply = Column(String(100))
    
    # Environmental
    temp_range_min = Column(Float, default=-10.0)
    temp_range_max = Column(Float, default=40.0)
    
    # Relationships
    instruments = relationship("Instrument", back_populates="model")

    @property
    def unit(self):
        return self.max_capacity_unit or "kg"
    
    def __repr__(self):
        return f"<InstrumentModel {self.model_name} Class {self.accuracy_class}>"


class Instrument(Base, TimestampMixin):
    """A specific physical instrument instance."""
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("instrument_models.id"), nullable=False)
    serial_number = Column(String(100), nullable=False)
    year_of_manufacture = Column(Integer)
    status = Column(String(50), default="REGISTERED")  # REGISTERED, ACTIVE, TESTING, APPROVED, REJECTED, RETIRED
    laboratory_id = Column(Integer, ForeignKey("laboratories.id"))
    notes = Column(Text)
    
    # Relationships
    model = relationship("InstrumentModel", back_populates="instruments")
    laboratory = relationship("Laboratory")
    test_sessions = relationship("TestSession", back_populates="instrument")

    def __repr__(self):
        return f"<Instrument SN:{self.serial_number}>"
